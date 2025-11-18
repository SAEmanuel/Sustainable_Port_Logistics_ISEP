import { useEffect, useMemo, useState } from "react";
import { FaAnchor, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import {
    getDocks,
    getDockById,
    getDockByCode,
    getDocksByVesselType,
    getDocksByLocation,
    filterDocks,
    createDock,
    patchDockByCode,
} from "../services/dockService";
import { getVesselTypes } from "../../vesselsTypes/services/vesselTypeService";
import type { VesselType } from "../../vesselsTypes/types/vesselType";
import { getAllPhysicalResources } from "../../physicalResource/services/physicalResourceService";
import type { Dock, UpdateDockRequest } from "../types/dock";
import { useTranslation } from "react-i18next";
import "../style/dockpage.css";

const MIN_LOADING_TIME = 500;
const guidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
const codeRegex = /^DK-\d{4}$/i;
const isStatus = (s: string) =>
    ["available", "unavailable", "maintenance"].includes(s.toLowerCase());

async function runWithLoading<T>(promise: Promise<T>, text: string) {
    const id = toast.loading(text);
    const start = Date.now();
    try {
        return await promise;
    } finally {
        const elapsed = Date.now() - start;
        if (elapsed < MIN_LOADING_TIME)
            await new Promise((res) => setTimeout(res, MIN_LOADING_TIME - elapsed));
        toast.dismiss(id);
    }
}

const sanitizeLocation = (s: string) =>
    s
        .replace(/[^a-zA-Z0-9À-ÿ\s\-_/.,]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

const parseDecimal = (s: string): number | undefined => {
    if (s == null || s === "") return undefined;
    const n = Number(String(s).replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
};

const isPositive = (n?: number) => n == null || n > 0;

type RegisterDockDtoFE = {
    code: string;
    physicalResourceCodes: string[];
    location: string;
    lengthM: number;
    depthM: number;
    maxDraftM: number;
    allowedVesselTypeNames: string[];
    status: "Available" | "Unavailable" | "Maintenance";
};

async function checkDockCodeExists(code: string): Promise<boolean> {
    const res = await fetch(
        `http://localhost:5008/api/Dock/code/${encodeURIComponent(code)}`,
        { credentials: "include" }
    );

    if (res.ok) return true;
    if (res.status === 404) return false;

    throw new Error("Erro ao validar código da dock");
}


// sugere o próximo DK-0001 livre
function computeNextDockCode(known: string[]): string {
    const taken = new Set(known.map((c) => c.toUpperCase().trim()));
    for (let i = 1; i <= 9999; i++) {
        const code = `DK-${String(i).padStart(4, "0")}`;
        if (!taken.has(code)) return code;
    }
    return `DK-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default function DockPage() {
    const { t } = useTranslation();

    const [items, setItems] = useState<Dock[]>([]);
    const [filtered, setFiltered] = useState<Dock[]>([]);
    const [loading, setLoading] = useState(true);

    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [allPRCodes, setAllPRCodes] = useState<string[]>([]);

    const [selected, setSelected] = useState<Dock | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [searchValue, setSearchValue] = useState("");

    // códigos conhecidos = dos cards (já vêm do getDocks)
    const allKnownCodes = useMemo(() => {
        return Array.from(
            new Set(
                items
                    .map((d) => (d.code ?? "").toUpperCase().trim())
                    .filter((c) => c !== "")
            )
        );
    }, [items]);

    // CREATE
    const [createData, setCreateData] = useState({
        code: "",
        location: "",
        status: "Available" as "Available" | "Unavailable" | "Maintenance",
    });
    const [createNums, setCreateNums] = useState({
        lengthM: "",
        depthM: "",
        maxDraftM: "",
    });
    const [createPRs, setCreatePRs] = useState<string[]>([]);
    const [createVTs, setCreateVTs] = useState<string[]>([]);
    const [createErrors, setCreateErrors] = useState<{
        code?: string;
        location?: string;
        lengthM?: string;
        depthM?: string;
        maxDraftM?: string;
        vessels?: string;
        numbers?: string;
    }>({});

    // EDIT
    const [editCode, setEditCode] = useState<string | null>(null);
    const [editData, setEditData] = useState<UpdateDockRequest>({});
    const [editPRs, setEditPRs] = useState<string[]>([]);
    const [editVTs, setEditVTs] = useState<string[]>([]);
    const [editNums, setEditNums] = useState({
        lengthM: "",
        depthM: "",
        maxDraftM: "",
    });
    const [errors, setErrors] = useState<{
        location?: string;
        lengthM?: string;
        depthM?: string;
        maxDraftM?: string;
        vessels?: string;
    }>({});

    const openEdit = (dock: Dock) => {
        setErrors({});
        setEditCode(dock.code);
        setEditData({ location: dock.location || "", status: dock.status || "" });
        setEditNums({
            lengthM: dock.lengthM?.toString() ?? "",
            depthM: dock.depthM?.toString() ?? "",
            maxDraftM: dock.maxDraftM?.toString() ?? "",
        });
        setEditPRs(dock.physicalResourceCodes ?? []);
        setEditVTs(dock.vesselTypeIds ?? []);
        setIsEditOpen(true);
        setSelected(null);
    };

    const closeEdit = () => {
        setIsEditOpen(false);
        setEditCode(null);
        setErrors({});
    };

    function openCreate() {
        setCreateErrors({});
        setCreatePRs([]);
        setCreateVTs([]);
        setCreateNums({ lengthM: "", depthM: "", maxDraftM: "" });
        setCreateData({
            code: computeNextDockCode(allKnownCodes),
            location: "",
            status: "Available",
        });
        setIsCreateOpen(true);
    }

    useEffect(() => {
        if (isEditOpen) setErrors({});
    }, [isEditOpen]);

    // PRs ocupadas (edição)
    const takenPRByOthers = useMemo(() => {
        const s = new Set<string>();
        items.forEach((d) => {
            if (d.code !== editCode) d.physicalResourceCodes?.forEach((c) => s.add(c));
        });
        return s;
    }, [items, editCode]);

    const availablePRsForEdit = useMemo(() => {
        return allPRCodes.filter(
            (code) => !takenPRByOthers.has(code) || editPRs.includes(code)
        );
    }, [allPRCodes, takenPRByOthers, editPRs]);

    // PRs ocupadas (criação)
    const takenPRForAll = useMemo(() => {
        const s = new Set<string>();
        items.forEach((d) => d.physicalResourceCodes?.forEach((c) => s.add(c)));
        return s;
    }, [items]);

    const availablePRsForCreate = useMemo(() => {
        return allPRCodes.filter((code) => !takenPRForAll.has(code));
    }, [allPRCodes, takenPRForAll]);

    function validateEdit(): boolean {
        const next: typeof errors = {};
        const loc = editData.location?.trim() ?? "";
        if (!loc)
            next.location = t("Dock.errors.locationRequired", {
                defaultValue: "Localização é obrigatória.",
            });
        else if (sanitizeLocation(loc).length !== loc.length)
            next.location = t("Dock.errors.locationInvalid", {
                defaultValue: "Localização contém caracteres inválidos.",
            });
        const L = parseDecimal(editNums.lengthM);
        const D = parseDecimal(editNums.depthM);
        const C = parseDecimal(editNums.maxDraftM);
        if (editNums.lengthM && !isPositive(L))
            next.lengthM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });
        if (editNums.depthM && !isPositive(D))
            next.depthM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });
        if (editNums.maxDraftM && !isPositive(C))
            next.maxDraftM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });
        if (!editVTs.length)
            next.vessels = t("Dock.errors.chooseVesselType", {
                defaultValue: "Seleciona pelo menos um tipo de navio.",
            });
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function validateCreate(): boolean {
        const next: typeof createErrors = {};

        const code = (createData.code ?? "").trim().toUpperCase();
        if (!code)
            next.code = t("Dock.errors.codeRequired", {
                defaultValue: "Código é obrigatório",
            });
        else if (!codeRegex.test(code))
            next.code = t("Dock.errors.codeFormat", {
                defaultValue: "Formato DK-0000",
            });
        else if (allKnownCodes.includes(code))
            next.code = t("Dock.errors.codeDuplicate", {
                defaultValue: "Já existe uma dock com esse código",
            });

        const loc = (createData.location ?? "").trim();
        if (!loc)
            next.location = t("Dock.errors.locationRequired", {
                defaultValue: "Localização é obrigatória.",
            });
        else if (sanitizeLocation(loc).length !== loc.length)
            next.location = t("Dock.errors.locationInvalid", {
                defaultValue: "Localização contém caracteres inválidos.",
            });

        const rawL = (createNums.lengthM ?? "").trim();
        const rawD = (createNums.depthM ?? "").trim();
        const rawC = (createNums.maxDraftM ?? "").trim();

        if (!rawL)
            next.lengthM = t("Dock.errors.lengthRequired", {
                defaultValue: "Comprimento é obrigatório",
            });
        if (!rawD)
            next.depthM = t("Dock.errors.depthRequired", {
                defaultValue: "Profundidade é obrigatória",
            });
        if (!rawC)
            next.maxDraftM = t("Dock.errors.maxdraftRequired", {
                defaultValue: "Calado é obrigatório",
            });

        const L = rawL ? parseDecimal(rawL) : undefined;
        const D = rawD ? parseDecimal(rawD) : undefined;
        const C = rawC ? parseDecimal(rawC) : undefined;

        if (rawL && L == null)
            next.lengthM = t("Dock.errors.numberInvalid", {
                defaultValue: "Número inválido",
            });
        else if (rawL && !isPositive(L))
            next.lengthM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });

        if (rawD && D == null)
            next.depthM = t("Dock.errors.numberInvalid", {
                defaultValue: "Número inválido",
            });
        else if (rawD && !isPositive(D))
            next.depthM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });

        if (rawC && C == null)
            next.maxDraftM = t("Dock.errors.numberInvalid", {
                defaultValue: "Número inválido",
            });
        else if (rawC && !isPositive(C))
            next.maxDraftM = t("Dock.errors.mustBePositive", {
                defaultValue: "Deve ser > 0",
            });

        if (!createVTs.length)
            next.vessels = t("Dock.errors.chooseVesselType", {
                defaultValue: "Seleciona pelo menos um tipo de navio.",
            });

        setCreateErrors(next);

        if (Object.keys(next).length > 0) {
            const first =
                next.code ??
                next.location ??
                next.lengthM ??
                next.depthM ??
                next.maxDraftM ??
                next.vessels ??
                t("Dock.errors.formFix", {
                    defaultValue: "Corrige os erros do formulário.",
                });
            toast.error(first);
            return false;
        }
        return true;
    }

    async function assertCodeAvailableOrWarn(code: string): Promise<boolean> {
        try {
            const exists = await checkDockCodeExists(code);
            if (exists) {
                setCreateErrors((p) => ({
                    ...p,
                    code: t("Dock.errors.codeDuplicate", {
                        defaultValue: "Já existe uma dock com esse código",}),}));
                toast.error(
                    t("Dock.errors.codeDuplicate", {
                        defaultValue: "Já existe uma dock com esse código",}));
                return false;
            }
            return true;
        } catch {
            return true;
        }
    }


    useEffect(() => {
        async function load() {
            try {
                const data = await runWithLoading(
                    getDocks(),
                    t("Dock.messages.loading", { defaultValue: "A carregar..." })
                );
                setItems(data);
                setFiltered(data);
                toast.success(
                    t("Dock.messages.searchSuccess", {
                        count: data.length,
                        defaultValue: "Resultados: {{count}}",
                    })
                );
                const types = await getVesselTypes();
                setVesselTypes(types);
                const prs = await getAllPhysicalResources().catch(() => []);
                setAllPRCodes(
                    (prs ?? [])
                        .map((p: any) => (typeof p.code === "string" ? p.code : p.code?.value))
                        .filter(Boolean)
                );
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [t]);

    const vesselTypeIdByName = useMemo(() => {
        const map = new Map<string, string>();
        vesselTypes.forEach((vt) => map.set(vt.name.toLowerCase(), vt.id));
        return map;
    }, [vesselTypes]);

    const vesselTypeNamesFor = useMemo(() => {
        const map = new Map(vesselTypes.map((vt) => [vt.id, vt.name]));
        return (ids?: string[]) => (ids ?? []).map((id) => map.get(id) ?? "—");
    }, [vesselTypes]);

    async function executeSearch() {
        const q = searchValue.trim();
        if (!q) {
            setFiltered(items);
            return;
        }
        try {
            let result: Dock[] = [];
            if (guidRegex.test(q)) {
                result = [
                    await runWithLoading(
                        getDockById(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    ),
                ];
            } else if (codeRegex.test(q)) {
                result = [
                    await runWithLoading(
                        getDockByCode(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    ),
                ];
            } else if (isStatus(q)) {
                result = await runWithLoading(
                    filterDocks({ status: q }),
                    t("Dock.messages.loading", { defaultValue: "A carregar..." })
                );
            } else {
                const vtId = vesselTypeIdByName.get(q.toLowerCase());
                if (vtId) {
                    result = await runWithLoading(
                        getDocksByVesselType(vtId),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    );
                } else {
                    result = await runWithLoading(
                        getDocksByLocation(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    );
                    if (!result.length) {
                        const ql = q.toLowerCase();
                        result = items.filter(
                            (d) =>
                                d.code?.toLowerCase().includes(ql) ||
                                d.location?.toLowerCase().includes(ql) ||
                                (d.status ?? "").toLowerCase().includes(ql) ||
                                vesselTypeNamesFor(d.vesselTypeIds)
                                    .join(" ")
                                    .toLowerCase()
                                    .includes(ql) ||
                                (d.physicalResourceCodes ?? []).some((c) =>
                                    c.toLowerCase().includes(ql)
                                )
                        );
                    }
                }
            }
            setFiltered(result.filter(Boolean));
            if (result.length === 0)
                toast.error(
                    t("Dock.messages.noResults", { defaultValue: "Sem resultados" })
                );
            else
                toast.success(
                    t("Dock.messages.searchSuccess", {
                        count: result.length,
                        defaultValue: "Resultados: {{count}}",
                    })
                );
        } catch {
            setFiltered([]);
            toast.error(
                t("Dock.messages.noResults", { defaultValue: "Sem resultados" })
            );
        }
    }

    async function handleCreate() {
        if (!validateCreate()) return;

        const code = createData.code.trim().toUpperCase();
        const ok = await assertCodeAvailableOrWarn(code);
        if (!ok) return;

        const payload: RegisterDockDtoFE = {
            code,
            physicalResourceCodes: createPRs,
            location: createData.location.trim(),
            lengthM: parseDecimal(createNums.lengthM)!,
            depthM: parseDecimal(createNums.depthM)!,
            maxDraftM: parseDecimal(createNums.maxDraftM)!,
            allowedVesselTypeNames: createVTs,
            status: createData.status,
        };

        const created = await runWithLoading(
            createDock(payload as any),
            t("Dock.modal.addTitle", { defaultValue: "Adicionar Dock" })
        ).catch((e) => {
            const status = e?.response?.status;
            const msg: string =
                e?.response?.data?.error ??
                e?.response?.data?.message ??
                e?.message ??
                "Erro ao criar dock";
            const isDup =
                status === 409 ||
                /already exists/i.test(msg) ||
                /já existe/i.test(msg) ||
                /duplicate/i.test(msg);
            if (isDup) {
                setCreateErrors((p) => ({
                    ...p,
                    code: t("Dock.errors.codeDuplicate", {
                        defaultValue: "Já existe uma dock com esse código",
                    }),
                }));
                toast.error(
                    t("Dock.errors.codeDuplicate", {
                        defaultValue: "Já existe uma dock com esse código",
                    })
                );
            } else {
                toast.error(msg);
            }
            return null;
        });
        if (!created) return;

        toast.success(t("Dock.messages.created", { defaultValue: "Dock criada" }));
        const data = await getDocks();
        setItems(data);
        setFiltered(data);
        setIsCreateOpen(false);

        const refreshedCodes = Array.from(new Set([...allKnownCodes, code]));
        setCreateData({
            code: computeNextDockCode(refreshedCodes),
            location: "",
            status: "Available",
        });
        setCreateNums({ lengthM: "", depthM: "", maxDraftM: "" });
        setCreatePRs([]);
        setCreateVTs([]);
        setCreateErrors({});
    }

    async function handleSaveEdit() {
        if (!editCode) return;
        if (!validateEdit()) {
            toast.error(
                t("Dock.errors.formFix", { defaultValue: "Corrige os erros do formulário." })
            );
            return;
        }
        const payload: UpdateDockRequest = {
            location: editData.location?.trim() || undefined,
            status: editData.status?.trim() || undefined,
            lengthM: parseDecimal(editNums.lengthM),
            depthM: parseDecimal(editNums.depthM),
            maxDraftM: parseDecimal(editNums.maxDraftM),
            physicalResourceCodes: editPRs,
            allowedVesselTypeIds: editVTs,
        };
        if (
            !payload.location &&
            !payload.status &&
            payload.lengthM === undefined &&
            payload.depthM === undefined &&
            payload.maxDraftM === undefined &&
            (payload.physicalResourceCodes ?? []).length === 0 &&
            (payload.allowedVesselTypeIds ?? []).length === 0
        ) {
            toast.error(
                t("Dock.messages.fillSomething", {
                    defaultValue: "Preenche algum campo para editar",
                })
            );
            return;
        }
        const updated = await runWithLoading(
            patchDockByCode(editCode, payload),
            t("Dock.modal.editTitle", { defaultValue: "Editar Dock" })
        ).catch((e) => {
            toast.error(e?.response?.data?.error ?? "Erro ao atualizar");
            return null;
        });
        if (!updated) return;
        toast.success(t("Dock.messages.updated", { defaultValue: "Dock atualizada" }));
        const data = await getDocks();
        setItems(data);
        setFiltered(data);
        closeEdit();
    }

    const closeSlide = () => setSelected(null);

    const statusLabel = (s?: string) =>
        t(`Dock.status.${s ?? ""}`, { defaultValue: s ?? "—" });

    return (
        <div className="dk-page">
            {selected && <div className="dk-overlay" onClick={closeSlide} />}

            {/* HEADER */}
            <button
                className="dk-back-btn"
                onClick={() => window.history.back()}>
                ←
            </button>
            <div className="dk-title-area">
                <div>
                    <h2 className="dk-title">
                        <FaAnchor /> {t("Dock.title", { defaultValue: "Gestão de Docks" })}
                    </h2>
                    <p className="dk-sub">
                        {t("Dock.count", {
                            count: items.length,
                            defaultValue: "{{count}} docks registadas",
                        })}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="dk-create-btn-top" onClick={openCreate}>
                        <FaPlus />{" "}
                        {t("Dock.buttons.add", { defaultValue: "Adicionar Dock" })}
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="dk-search-box">
                <div className="dk-search-wrapper">
                    <input
                        placeholder={t("Dock.searchPlaceholder", { defaultValue: "Pesquisar..." })}
                        className="dk-search"
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            if (!e.target.value) setFiltered(items);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                        autoComplete="off"
                    />
                    {searchValue !== "" && (
                        <button
                            className="dk-clear-input"
                            onClick={() => {
                                setSearchValue("");
                                setFiltered(items);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button className="dk-search-btn" onClick={executeSearch}>
                    <FaSearch />
                </button>
            </div>

            {/* CARDS */}
            <div className="dk-card-grid">
                {!loading &&
                    filtered.map((d) => (
                        <div key={d.id} className="dk-card" onClick={() => setSelected(d)}>
                            <div className="dk-card-header">
                                <span className="dk-card-title">{d.code}</span>
                                <span className="dk-badge">{statusLabel(d.status)}</span>
                            </div>
                            <div className="dk-card-body">
                                <div className="dk-row-item">
                  <span className="dk-label">
                    {t("Dock.details.location", { defaultValue: "Localização" })}
                  </span>
                                    <span className="dk-chip">{d.location || "—"}</span>
                                </div>

                                <div className="dk-row-item">
                  <span className="dk-label">
                    {t("Dock.details.vesselType", {
                        defaultValue: "Tipos de Navio",
                    })}
                  </span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {vesselTypeNamesFor(d.vesselTypeIds).map((name) => (
                                            <span className="dk-chip" key={name + d.id}>
                        {name}
                      </span>
                                        ))}
                                        {(!d.vesselTypeIds || d.vesselTypeIds.length === 0) && (
                                            <span className="dk-chip">—</span>
                                        )}
                                    </div>
                                </div>

                                {d.physicalResourceCodes?.length ? (
                                    <div className="dk-row-item">
                    <span className="dk-label">
                      {t("Dock.details.physicalResource", {
                          defaultValue: "Recursos Físicos",
                      })}
                    </span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {d.physicalResourceCodes.map((code) => (
                                                <span className="dk-chip" key={code + d.id}>
                          {code}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {(d.lengthM || d.depthM || d.maxDraftM) && (
                                    <div className="dk-row-item">
                    <span className="dk-label">
                      {t("Dock.details.dimensions", {
                          defaultValue: "Dimensões (m)",
                      })}
                    </span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {d.lengthM !== undefined && (
                                                <span className="dk-chip">
                          {t("Dock.details.length", {
                              defaultValue: "Comprimento",
                          })}
                                                    : {d.lengthM}
                        </span>
                                            )}
                                            {d.depthM !== undefined && (
                                                <span className="dk-chip">
                          {t("Dock.details.depth", {
                              defaultValue: "Profundidade",
                          })}
                                                    : {d.depthM}
                        </span>
                                            )}
                                            {d.maxDraftM !== undefined && (
                                                <span className="dk-chip">
                          {t("Dock.details.maxdraft", {
                              defaultValue: "Calado Máximo",
                          })}
                                                    : {d.maxDraftM}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
            </div>

            
            {/* SLIDE PANEL */}
            {selected && (
                <div className="dk-slide">
                    <button className="dk-slide-close" onClick={closeSlide}>
                        <FaTimes />
                    </button>

                    <h3>{selected.code}</h3>

                    <p>
                        <strong>
                            {t("Dock.details.location", { defaultValue: "Localização" })}:
                        </strong>{" "}
                        {selected.location || "—"}
                    </p>
                    <p>
                        <strong>
                            {t("Dock.details.status", { defaultValue: "Estado" })}:
                        </strong>{" "}
                        {statusLabel(selected.status)}
                    </p>

                    <p>
                        <strong>
                            {t("Dock.details.vesselType", {
                                defaultValue: "Tipos de Navio",
                            })}
                            :
                        </strong>
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginBottom: 8,
                        }}
                    >
                        {vesselTypeNamesFor(selected.vesselTypeIds).map((name) => (
                            <span className="dk-chip" key={name + "_sel"}>
                {name}
              </span>
                        ))}
                        {(!selected.vesselTypeIds ||
                            selected.vesselTypeIds.length === 0) && (
                            <span className="dk-chip">—</span>
                        )}
                    </div>

                    {selected.physicalResourceCodes?.length ? (
                        <>
                            <p>
                                <strong>
                                    {t("Dock.details.physicalResource", {
                                        defaultValue: "Recursos Físicos",
                                    })}
                                    :
                                </strong>
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {selected.physicalResourceCodes.map((c) => (
                                    <span className="dk-chip" key={c + "_sel"}>
                    {c}
                  </span>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {(selected.lengthM || selected.depthM || selected.maxDraftM) && (
                        <>
                            <p>
                                <strong>
                                    {t("Dock.details.dimensions", {
                                        defaultValue: "Dimensões (m)",
                                    })}
                                    :
                                </strong>
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {selected.lengthM !== undefined && (
                                    <span className="dk-chip">
                    {t("Dock.details.length", {
                        defaultValue: "Comprimento",
                    })}
                                        : {selected.lengthM}
                  </span>
                                )}
                                {selected.depthM !== undefined && (
                                    <span className="dk-chip">
                    {t("Dock.details.depth", {
                        defaultValue: "Profundidade",
                    })}
                                        : {selected.depthM}
                  </span>
                                )}
                                {selected.maxDraftM !== undefined && (
                                    <span className="dk-chip">
                    {t("Dock.details.maxdraft", {
                        defaultValue: "Calado Máximo",
                    })}
                                        : {selected.maxDraftM}
                  </span>
                                )}
                            </div>
                        </>
                    )}

                    <div className="dk-slide-actions">
                        <button className="dk-btn-edit" onClick={() => openEdit(selected)}>
                            {t("Dock.buttons.edit", { defaultValue: "Editar" })}
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="dk-modal-overlay">
                    <div className="dk-modal">
                        <h3>
                            {t("Dock.modal.addTitle", { defaultValue: "Adicionar Dock" })}
                        </h3>

                        <div className="dk-modal-body">
                            <label>
                                {t("Dock.fields.code", { defaultValue: "Código *" })}
                            </label>
                            <input
                                className={`dk-input ${createErrors.code ? "dk-input--error" : ""}`}
                                value={createData.code}
                                onChange={(e) => {
                                    const v = e.target.value.toUpperCase();
                                    setCreateData({ ...createData, code: v });
                                    if (createErrors.code)
                                        setCreateErrors((p) => ({ ...p, code: undefined }));
                                }}
                                onBlur={async (e) => {
                                    const v = e.target.value.toUpperCase().trim();
                                    if (!v) return;

                                    if (!codeRegex.test(v)) {
                                        setCreateErrors((p) => ({
                                            ...p,
                                            code: t("Dock.errors.codeFormat", { defaultValue: "Formato DK-0000" }),
                                        }));
                                        return;
                                    }

                                    if (allKnownCodes.includes(v)) {
                                        setCreateErrors((p) => ({
                                            ...p,
                                            code: t("Dock.errors.codeDuplicate", {
                                                defaultValue: "Já existe uma dock com esse código",
                                            }),
                                        }));
                                        return;
                                    }

                                    try {
                                        const exists = await checkDockCodeExists(v);   // 👈 silencioso
                                        if (exists) {
                                            setCreateErrors((p) => ({
                                                ...p,
                                                code: t("Dock.errors.codeDuplicate", {
                                                    defaultValue: "Já existe uma dock com esse código",
                                                }),
                                            }));
                                        }
                                    } catch {
                                    }
                                }}
                                placeholder="DK-0000"
                            />
                            {createErrors.code && (
                                <div className="dk-error-text">{createErrors.code}</div>
                            )}

                            <label>
                                {t("Dock.fields.location", {
                                    defaultValue: "Localização *",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    createErrors.location ? "dk-input--error" : ""
                                }`}
                                value={createData.location}
                                onChange={(e) => {
                                    const v = sanitizeLocation(e.target.value);
                                    setCreateData({ ...createData, location: v });
                                    if (createErrors.location)
                                        setCreateErrors((p) => ({
                                            ...p,
                                            location: undefined,
                                        }));
                                }}
                            />
                            {createErrors.location && (
                                <div className="dk-error-text">{createErrors.location}</div>
                            )}

                            <label>
                                {t("Dock.fields.status", { defaultValue: "Estado" })}
                            </label>
                            <select
                                className="dk-input"
                                value={createData.status}
                                onChange={(e) =>
                                    setCreateData({
                                        ...createData,
                                        status: e.target.value as any,
                                    })
                                }
                            >
                                <option value="Available">
                                    {t("Dock.status.Available", { defaultValue: "Disponível" })}
                                </option>
                                <option value="Unavailable">
                                    {t("Dock.status.Unavailable", {
                                        defaultValue: "Indisponível",
                                    })}
                                </option>
                                <option value="Maintenance">
                                    {t("Dock.status.Maintenance", {
                                        defaultValue: "Manutenção",
                                    })}
                                </option>
                            </select>

                            <label>
                                {t("Dock.fields.length", {
                                    defaultValue: "Comprimento (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    createErrors.lengthM ? "dk-input--error" : ""
                                }`}
                                inputMode="decimal"
                                value={createNums.lengthM}
                                onChange={(e) => {
                                    setCreateNums({ ...createNums, lengthM: e.target.value });
                                    if (createErrors.lengthM)
                                        setCreateErrors((p) => ({
                                            ...p,
                                            lengthM: undefined,
                                        }));
                                }}
                                onBlur={(e) =>
                                    setCreateNums({
                                        ...createNums,
                                        lengthM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {createErrors.lengthM && (
                                <div className="dk-error-text">{createErrors.lengthM}</div>
                            )}

                            <label>
                                {t("Dock.fields.depth", {
                                    defaultValue: "Profundidade (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    createErrors.depthM ? "dk-input--error" : ""
                                }`}
                                inputMode="decimal"
                                value={createNums.depthM}
                                onChange={(e) => {
                                    setCreateNums({ ...createNums, depthM: e.target.value });
                                    if (createErrors.depthM)
                                        setCreateErrors((p) => ({
                                            ...p,
                                            depthM: undefined,
                                        }));
                                }}
                                onBlur={(e) =>
                                    setCreateNums({
                                        ...createNums,
                                        depthM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {createErrors.depthM && (
                                <div className="dk-error-text">{createErrors.depthM}</div>
                            )}

                            <label>
                                {t("Dock.fields.maxdraft", {
                                    defaultValue: "Calado Máximo (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    createErrors.maxDraftM ? "dk-input--error" : ""
                                }`}
                                inputMode="decimal"
                                value={createNums.maxDraftM}
                                onChange={(e) => {
                                    setCreateNums({ ...createNums, maxDraftM: e.target.value });
                                    if (createErrors.maxDraftM)
                                        setCreateErrors((p) => ({
                                            ...p,
                                            maxDraftM: undefined,
                                        }));
                                }}
                                onBlur={(e) =>
                                    setCreateNums({
                                        ...createNums,
                                        maxDraftM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {createErrors.maxDraftM && (
                                <div className="dk-error-text">{createErrors.maxDraftM}</div>
                            )}

                            <label>
                                {t("Dock.fields.physicalResource", {
                                    defaultValue: "Recursos Físicos (disponíveis)",
                                })}
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    maxHeight: 160,
                                    overflow: "auto",
                                }}
                            >
                                {availablePRsForCreate.map((code) => (
                                    <label
                                        key={code}
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            alignItems: "center",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={createPRs.includes(code)}
                                            onChange={(e) =>
                                                setCreatePRs((prev) =>
                                                    e.target.checked
                                                        ? [...prev, code]
                                                        : prev.filter((x) => x !== code)
                                                )
                                            }
                                        />
                                        {code}
                                    </label>
                                ))}
                                {availablePRsForCreate.length === 0 && (
                                    <span className="dk-chip">
                    {t("Dock.messages.noAvailablePR", {
                        defaultValue: "Sem recursos disponíveis",
                    })}
                  </span>
                                )}
                            </div>

                            <label>
                                {t("Dock.fields.vesselType", {
                                    defaultValue: "Tipos de Navio Permitidos",
                                })}
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    maxHeight: 160,
                                    overflow: "auto",
                                }}
                            >
                                {vesselTypes.map((vt) => (
                                    <label
                                        key={vt.id}
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            alignItems: "center",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={createVTs.includes(vt.name)}
                                            onChange={(e) =>
                                                setCreateVTs((prev) =>
                                                    e.target.checked
                                                        ? [...prev, vt.name]
                                                        : prev.filter((x) => x !== vt.name)
                                                )
                                            }
                                        />
                                        {vt.name}
                                    </label>
                                ))}
                            </div>
                            {createErrors.vessels && (
                                <div className="dk-error-text">{createErrors.vessels}</div>
                            )}

                            <p style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                                {t("Dock.chips.summary", {
                                    pr: createPRs.length,
                                    vt: createVTs.length,
                                    defaultValue:
                                        "{{pr}} PR selecionado(s) • {{vt}} tipo(s) de navio",
                                })}
                            </p>
                        </div>

                        <div className="dk-modal-actions">
                            <button
                                className="dk-btn-cancel"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                {t("Dock.buttons.cancel", { defaultValue: "Cancelar" })}
                            </button>
                            <button className="dk-btn-save" onClick={handleCreate}>
                                {t("Dock.buttons.save", { defaultValue: "Guardar" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="dk-modal-overlay">
                    <div className="dk-modal">
                        <h3>
                            {t("Dock.modal.editTitle", { defaultValue: "Editar Dock" })}
                        </h3>

                        <div className="dk-modal-body">
                            <label>
                                {t("Dock.fields.location", {
                                    defaultValue: "Localização *",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    errors.location ? "dk-input--error" : ""
                                }`}
                                value={editData.location || ""}
                                onChange={(e) => {
                                    const v = sanitizeLocation(e.target.value);
                                    setEditData({ ...editData, location: v });
                                    if (errors.location)
                                        setErrors((p) => ({ ...p, location: undefined }));
                                }}
                            />
                            {errors.location && (
                                <div className="dk-error-text">{errors.location}</div>
                            )}

                            <label>
                                {t("Dock.fields.status", { defaultValue: "Estado" })}
                            </label>
                            <select
                                className="dk-input"
                                value={editData.status || ""}
                                onChange={(e) =>
                                    setEditData({ ...editData, status: e.target.value })
                                }
                            >
                                <option value="Available">
                                    {t("Dock.status.Available", { defaultValue: "Disponível" })}
                                </option>
                                <option value="Unavailable">
                                    {t("Dock.status.Unavailable", {
                                        defaultValue: "Indisponível",
                                    })}
                                </option>
                                <option value="Maintenance">
                                    {t("Dock.status.Maintenance", {
                                        defaultValue: "Manutenção",
                                    })}
                                </option>
                            </select>

                            <label>
                                {t("Dock.fields.length", {
                                    defaultValue: "Comprimento (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    errors.lengthM ? "dk-input--error" : ""
                                }`}
                                type="text"
                                inputMode="decimal"
                                value={editNums.lengthM}
                                onChange={(e) => {
                                    setEditNums({ ...editNums, lengthM: e.target.value });
                                    if (errors.lengthM)
                                        setErrors((p) => ({ ...p, lengthM: undefined }));
                                }}
                                onBlur={(e) =>
                                    setEditNums({
                                        ...editNums,
                                        lengthM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {errors.lengthM && (
                                <div className="dk-error-text">{errors.lengthM}</div>
                            )}

                            <label>
                                {t("Dock.fields.depth", {
                                    defaultValue: "Profundidade (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    errors.depthM ? "dk-input--error" : ""
                                }`}
                                type="text"
                                inputMode="decimal"
                                value={editNums.depthM}
                                onChange={(e) => {
                                    setEditNums({ ...editNums, depthM: e.target.value });
                                    if (errors.depthM)
                                        setErrors((p) => ({ ...p, depthM: undefined }));
                                }}
                                onBlur={(e) =>
                                    setEditNums({
                                        ...editNums,
                                        depthM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {errors.depthM && (
                                <div className="dk-error-text">{errors.depthM}</div>
                            )}

                            <label>
                                {t("Dock.fields.maxdraft", {
                                    defaultValue: "Calado Máximo (m)",
                                })}
                            </label>
                            <input
                                className={`dk-input ${
                                    errors.maxDraftM ? "dk-input--error" : ""
                                }`}
                                type="text"
                                inputMode="decimal"
                                value={editNums.maxDraftM}
                                onChange={(e) => {
                                    setEditNums({ ...editNums, maxDraftM: e.target.value });
                                    if (errors.maxDraftM)
                                        setErrors((p) => ({ ...p, maxDraftM: undefined }));
                                }}
                                onBlur={(e) =>
                                    setEditNums({
                                        ...editNums,
                                        maxDraftM: e.target.value.replace(",", "."),
                                    })
                                }
                            />
                            {errors.maxDraftM && (
                                <div className="dk-error-text">{errors.maxDraftM}</div>
                            )}

                            <label>
                                {t("Dock.details.physicalResource", {
                                    defaultValue: "Recursos Físicos",
                                })}
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    maxHeight: 160,
                                    overflow: "auto",
                                }}
                            >
                                {availablePRsForEdit.map((code) => (
                                    <label
                                        key={code}
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            alignItems: "center",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={editPRs.includes(code)}
                                            onChange={(e) =>
                                                setEditPRs((prev) =>
                                                    e.target.checked
                                                        ? [...prev, code]
                                                        : prev.filter((x) => x !== code)
                                                )
                                            }
                                        />
                                        {code}
                                    </label>
                                ))}
                                {availablePRsForEdit.length === 0 && (
                                    <span className="dk-chip">
                    {t("Dock.messages.noAvailablePR", {
                        defaultValue: "Sem recursos disponíveis",
                    })}
                  </span>
                                )}
                            </div>

                            <label>
                                {t("Dock.fields.vesselType", {
                                    defaultValue: "Tipos de Navio Permitidos",
                                })}
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    maxHeight: 160,
                                    overflow: "auto",
                                }}
                            >
                                {vesselTypes.map((vt) => (
                                    <label
                                        key={vt.id}
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            alignItems: "center",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={editVTs.includes(vt.id)}
                                            onChange={(e) => {
                                                setEditVTs((prev) =>
                                                    e.target.checked
                                                        ? [...prev, vt.id]
                                                        : prev.filter((x) => x !== vt.id)
                                                );
                                                if (errors.vessels)
                                                    setErrors((p) => ({ ...p, vessels: undefined }));
                                            }}
                                        />
                                        {vt.name}
                                    </label>
                                ))}
                            </div>
                            {errors.vessels && (
                                <div className="dk-error-text">{errors.vessels}</div>
                            )}
                        </div>

                        <div className="dk-modal-actions">
                            <button className="dk-btn-cancel" onClick={closeEdit}>
                                {t("Dock.buttons.cancel", { defaultValue: "Cancelar" })}
                            </button>
                            <button className="dk-btn-save" onClick={handleSaveEdit}>
                                {t("Dock.buttons.save", { defaultValue: "Guardar" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}