// src/features/docks/pages/Dock.tsx

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DockCreateModal } from "../components/DockCreateModal";
import { DockEditModal } from "../components/DockEditModal";
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

import { apiGetVesselTypes } from "../../vesselsTypes/services/vesselTypeService";
import type { VesselType } from "../../vesselsTypes/domain/vesselType";
import { getAllPhysicalResources } from "../../physicalResource/services/physicalResourceService";

import type { Dock, UpdateDockRequest } from "../domain/dock";
import { useTranslation } from "react-i18next";
import "../style/dockpage.css";

import { mapVesselTypeDto } from "../../vesselsTypes/mappers/vesselTypeMapper";
import { DockHeader } from "../components/DockHeader";
import { DockCardGrid } from "../components/DockCardGrid";
import { DockSearchBar } from "../components/DockSearchBar";
import { DockSlidePanel } from "../components/DockSlidePanel";
import { val, vals } from "../utils/dockValueHelpers";

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
        if (elapsed < MIN_LOADING_TIME) {
            await new Promise((res) => setTimeout(res, MIN_LOADING_TIME - elapsed));
        }
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

// isto é basicamente igual ao teu RegisterDockDto backend
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
                    .map((d) => val(d.code).toUpperCase().trim())
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
        setEditCode(val(dock.code));
        setEditData({
            location: dock.location || "",
            status: dock.status != null ? String(dock.status) : "",
        });
        setEditNums({
            lengthM: dock.lengthM?.toString() ?? "",
            depthM: dock.depthM?.toString() ?? "",
            maxDraftM: dock.maxDraftM?.toString() ?? "",
        });
        setEditPRs(vals(dock.physicalResourceCodes));
        setEditVTs(vals(dock.allowedVesselTypeIds));
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
            if (val(d.code) !== editCode) {
                d.physicalResourceCodes.forEach((c) => s.add(val(c)));
            }
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
        items.forEach((d) =>
            d.physicalResourceCodes.forEach((c) => s.add(val(c)))
        );
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
                        defaultValue: "Já existe uma dock com esse código",
                    }),
                }));
                toast.error(
                    t("Dock.errors.codeDuplicate", {
                        defaultValue: "Já existe uma dock com esse código",
                    })
                );
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
                // ⬇⬇ AQUI estava o erro: Dock -> Dock[]
                const data = await runWithLoading<Dock[]>(
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

                const typesDto = await runWithLoading<any[]>(
                    apiGetVesselTypes(),
                    t("Vessel.messages.loading")
                );
                const types = typesDto.map(mapVesselTypeDto);
                setVesselTypes(types);

                const prs = await getAllPhysicalResources().catch(() => [] as any[]);
                setAllPRCodes(
                    (prs ?? [])
                        .map((p: any) =>
                            typeof p.code === "string" ? p.code : p.code?.value
                        )
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
                    await runWithLoading<Dock>(
                        getDockById(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    ),
                ];
            } else if (codeRegex.test(q)) {
                result = [
                    await runWithLoading<Dock>(
                        getDockByCode(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    ),
                ];
            } else if (isStatus(q)) {
                result = await runWithLoading<Dock[]>(
                    filterDocks({ status: q }),
                    t("Dock.messages.loading", { defaultValue: "A carregar..." })
                );
            } else {
                const vtId = vesselTypeIdByName.get(q.toLowerCase());
                if (vtId) {
                    result = await runWithLoading<Dock[]>(
                        getDocksByVesselType(vtId),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    );
                } else {
                    result = await runWithLoading<Dock[]>(
                        getDocksByLocation(q),
                        t("Dock.messages.loading", { defaultValue: "A carregar..." })
                    );
                    if (!result.length) {
                        const ql = q.toLowerCase();
                        result = items.filter((d) => {
                            const code = val(d.code).toLowerCase();
                            const loc = (d.location ?? "").toLowerCase();
                            const statusStr = d.status != null ? String(d.status) : "";
                            const vtNames = vesselTypeNamesFor(
                                vals(d.allowedVesselTypeIds)
                            )
                                .join(" ")
                                .toLowerCase();
                            const prCodesJoined = vals(d.physicalResourceCodes)
                                .join(" ")
                                .toLowerCase();

                            return (
                                code.includes(ql) ||
                                loc.includes(ql) ||
                                statusStr.toLowerCase().includes(ql) ||
                                vtNames.includes(ql) ||
                                prCodesJoined.includes(ql)
                            );
                        });
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
        ).catch((e: any) => {
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
                t("Dock.errors.formFix", {
                    defaultValue: "Corrige os erros do formulário.",
                })
            );
            return;
        }

        const statusStr =
            editData.status != null ? String(editData.status).trim() : "";

        const payload: UpdateDockRequest = {
            location: editData.location?.trim() || undefined,
            status: statusStr || undefined,
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
        ).catch((e: any) => {
            toast.error(e?.response?.data?.error ?? "Erro ao atualizar");
            return null;
        });

        if (!updated) return;

        toast.success(
            t("Dock.messages.updated", { defaultValue: "Dock atualizada" })
        );
        const data = await getDocks();
        setItems(data);
        setFiltered(data);
        closeEdit();
    }

    const closeSlide = () => setSelected(null);

    const statusLabel = (s?: string | number) =>
        t(`Dock.status.${s ?? ""}`, { defaultValue: String(s ?? "—") });

    return (
        <div className="dk-page">
            {selected && <div className="dk-overlay" onClick={closeSlide} />}

            {/* HEADER */}
            <button className="dk-back-btn" onClick={() => window.history.back()}>
                ←
            </button>

            <DockHeader
                count={items.length}
                onCreateClick={openCreate}
                title={t("Dock.title", { defaultValue: "Gestão de Docks" })}
                subtitle={t("Dock.count", {
                    count: items.length,
                    defaultValue: "{{count}} docks registadas",
                })}
            />

            {/* SEARCH */}
            <DockSearchBar
                value={searchValue}
                placeholder={t("Dock.searchPlaceholder", {
                    defaultValue: "Pesquisar...",
                })}
                onChange={(value) => {
                    setSearchValue(value);
                    if (!value) setFiltered(items);
                }}
                onSearch={executeSearch}
                onClear={() => {
                    setSearchValue("");
                    setFiltered(items);
                }}
            />

            {/* CARDS */}
            <DockCardGrid
                docks={filtered}
                loading={loading}
                onSelect={setSelected}
                vesselTypeNamesFor={vesselTypeNamesFor}
                statusLabel={statusLabel}
            />

            {/* SLIDE PANEL */}
            {selected && (
                <DockSlidePanel
                    dock={selected}
                    onClose={closeSlide}
                    onEdit={openEdit}
                    statusLabel={statusLabel}
                    vesselTypeNamesFor={vesselTypeNamesFor}
                />
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <DockCreateModal
                    isOpen={isCreateOpen}
                    t={t}
                    createData={createData}
                    setCreateData={setCreateData}
                    createNums={createNums}
                    setCreateNums={setCreateNums}
                    createPRs={createPRs}
                    setCreatePRs={setCreatePRs}
                    createVTs={createVTs}
                    setCreateVTs={setCreateVTs}
                    createErrors={createErrors}
                    setCreateErrors={setCreateErrors}
                    availablePRsForCreate={availablePRsForCreate}
                    vesselTypes={vesselTypes}
                    allKnownCodes={allKnownCodes}
                    onSave={handleCreate}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <DockEditModal
                    isOpen={isEditOpen}
                    t={t}
                    editData={editData}
                    setEditData={setEditData}
                    editNums={editNums}
                    setEditNums={setEditNums}
                    editPRs={editPRs}
                    setEditPRs={setEditPRs}
                    editVTs={editVTs}
                    setEditVTs={setEditVTs}
                    errors={errors}
                    setErrors={setErrors}
                    availablePRsForEdit={availablePRsForEdit}
                    vesselTypes={vesselTypes}
                    onSave={handleSaveEdit}
                    onClose={closeEdit}
                />
            )}
        </div>
    );
}
