// src/features/vvn/pages/VvnListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { FaShip, FaPlus, FaPaperPlane, FaArrowRotateLeft } from "react-icons/fa6";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import vvnService from "../service/vvnService";
import type {
    VesselVisitNotificationDto,
    FilterInProgressPendingVvnStatusDto,
    FilterWithdrawnVvnStatusDto,
    FilterSubmittedVvnStatusDto,
    FilterAcceptedVvnStatusDto,
    UpdateVesselVisitNotificationDto,
    RejectVesselVisitNotificationDto,
    CrewMemberDto,
    CargoManifestEntryDto,
    Iso6346Code,
} from "../types/vvnTypes";
import "../../storageAreas/style/storageAreaStyle.css";
import "../style/vvn.css";
import { useAppStore } from "../../../app/store";
import { Roles } from "../../../app/types";

type TabKey = "inprogress" | "submitted" | "accepted" | "withdrawn";

const GUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/* ========== Helpers ========== */
function shortDT(s?: string | null) {
    if (!s) return "-";
    const d = new Date(s);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}/${mm}`;
}
function fmtDT(s?: string | null) {
    if (!s) return "-";
    const d = new Date(s);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}
/** aceita Iso6346Code | string */
function isoString(x: Iso6346Code | string | undefined | null) {
    if (!x) return "-";
    if (typeof x === "string") return x;
    return (x as any).value || (x as any).Value || "-";
}

/* ====== AUTH PLACEHOLDERS ====== */
function isAdminLocalStorage(): boolean {
    const r = localStorage.getItem("role");
    if (r && /administrator/i.test(r.trim())) return true;

    const rolesRaw = localStorage.getItem("roles");
    if (rolesRaw) {
        try {
            const arr = JSON.parse(rolesRaw);
            if (Array.isArray(arr) && arr.some((x) => /administrator/i.test(String(x).trim()))) return true;
        } catch {
            const arr = rolesRaw.split(/[,\s]+/).filter(Boolean);
            if (arr.some((x) => /administrator/i.test(String(x).trim()))) return true;
        }
    }
    return false;
}
function getCurrentSarId(): string {
    return localStorage.getItem("sarId") || "";
}
/* ================================== */

export default function VvnListPage() {
    const { t } = useTranslation();

    // ler do store; se não houver user/roles no store, usar fallback do localStorage
    const user = useAppStore((s) => s.user);
    const admin = !!user?.roles?.includes(Roles.Administrator) || isAdminLocalStorage();

    // filtros base
    const [sarId, setSarId] = useState<string>("");
    const [tab, setTab] = useState<TabKey>("inprogress");
    const [loading, setLoading] = useState(false);

    // dados
    const [vvns, setVvns] = useState<VesselVisitNotificationDto[]>([]);
    const [selected, setSelected] = useState<VesselVisitNotificationDto | null>(null);

    // filtros extra
    const [specificRep, setSpecificRep] = useState<string>("");
    const [imo, setImo] = useState("");
    const [eta, setEta] = useState("");
    const [etd, setEtd] = useState("");
    const [submittedDate, setSubmittedDate] = useState("");
    const [acceptedDate, setAcceptedDate] = useState("");

    // contagens header
    const [counts, setCounts] = useState({ inprogress: 0, submitted: 0, accepted: 0, withdrawn: 0 });

    // modais (reject/update – úteis para futuro)
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectMsg, setRejectMsg] = useState("");
    const [updOpen, setUpdOpen] = useState(false);
    const [updVolume, setUpdVolume] = useState<string>("");
    const [updDock, setUpdDock] = useState<string>("");

    // popups de detalhe
    const [crewOpen, setCrewOpen] = useState(false);
    const [loadOpen, setLoadOpen] = useState(false);
    const [unloadOpen, setUnloadOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);

    // se NÃO fores admin, tentar descobrir SAR; se fores admin, limpar sarId para evitar ramo SAR
    useEffect(() => {
        if (admin) {
            setSarId("");
            return;
        }
        const id = getCurrentSarId();
        setSarId(id);
        if (!id) toast("SAR ID não definido (placeholder).", { icon: "⚠️" });
    }, [admin]);

    const MIN_LOADING_TIME = 500;
    async function runWithLoading<T>(promise: Promise<T>) {
        const id = toast.loading(t("common.loading") as string);
        const start = Date.now();
        try {
            return await promise;
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < MIN_LOADING_TIME) await new Promise((res) => setTimeout(res, MIN_LOADING_TIME - elapsed));
            toast.dismiss(id);
        }
    }

    function tabLabel(k: TabKey) {
        switch (k) {
            case "inprogress":
                return t("vvn.tabs.inProgressPending") || "In-Progress / Pending";
            case "submitted":
                return t("vvn.tabs.submitted") || "Submitted";
            case "accepted":
                return t("vvn.tabs.accepted") || "Accepted";
            case "withdrawn":
                return t("vvn.tabs.withdrawn") || "Withdrawn";
        }
    }

    async function load() {
        setLoading(true);
        try {
            let data: VesselVisitNotificationDto[] = [];
            const safeRep = GUID_RE.test(specificRep) ? specificRep : undefined;

            if (tab === "inprogress") {
                const f: FilterInProgressPendingVvnStatusDto = {
                    specificRepresentative: safeRep,
                    vesselImoNumber: imo || undefined,
                    estimatedTimeArrival: eta || undefined,
                    estimatedTimeDeparture: etd || undefined,
                };
                data = admin
                    ? await vvnService.getInProgressPendingAll(f)
                    : GUID_RE.test(sarId)
                        ? await vvnService.getInProgressPendingBySar(sarId, f)
                        : [];
            } else if (tab === "withdrawn") {
                const f: FilterWithdrawnVvnStatusDto = {
                    specificRepresentative: safeRep,
                    vesselImoNumber: imo || undefined,
                    estimatedTimeArrival: eta || undefined,
                    estimatedTimeDeparture: etd || undefined,
                };
                data = admin
                    ? await vvnService.getWithdrawnAll(f)
                    : GUID_RE.test(sarId)
                        ? await vvnService.getWithdrawnBySar(sarId, f)
                        : [];
            } else if (tab === "submitted") {
                const f: FilterSubmittedVvnStatusDto = {
                    specificRepresentative: safeRep,
                    vesselImoNumber: imo || undefined,
                    estimatedTimeArrival: eta || undefined,
                    estimatedTimeDeparture: etd || undefined,
                    submittedDate: submittedDate || undefined,
                };
                data = admin
                    ? await vvnService.getSubmittedAll(f)
                    : GUID_RE.test(sarId)
                        ? await vvnService.getSubmittedBySar(sarId, f)
                        : [];
            } else if (tab === "accepted") {
                const f: FilterAcceptedVvnStatusDto = {
                    specificRepresentative: safeRep,
                    vesselImoNumber: imo || undefined,
                    estimatedTimeArrival: eta || undefined,
                    estimatedTimeDeparture: etd || undefined,
                    submittedDate: submittedDate || undefined,
                    acceptedDate: acceptedDate || undefined,
                };
                data = admin
                    ? await vvnService.getAcceptedAll(f)
                    : GUID_RE.test(sarId)
                        ? await vvnService.getAcceptedBySar(sarId, f)
                        : [];
            }

            setVvns(data);
            setSelected(data[0] ?? null);
            toast.success((t("vvn.toast.loaded") as string));
        } catch (e: any) {
            toast.error(e?.response?.data ?? (t("vvn.toast.loadError") as string));
        } finally {
            setLoading(false);
        }
    }

    async function loadCounts() {
        try {
            const [inprog, subm, acc, wdr] = await Promise.all([
                admin
                    ? vvnService.getInProgressPendingAll({})
                    : GUID_RE.test(sarId)
                        ? vvnService.getInProgressPendingBySar(sarId, {})
                        : Promise.resolve([]),
                admin
                    ? vvnService.getSubmittedAll({})
                    : GUID_RE.test(sarId)
                        ? vvnService.getSubmittedBySar(sarId, {})
                        : Promise.resolve([]),
                admin
                    ? vvnService.getAcceptedAll({})
                    : GUID_RE.test(sarId)
                        ? vvnService.getAcceptedBySar(sarId, {})
                        : Promise.resolve([]),
                admin
                    ? vvnService.getWithdrawnAll({})
                    : GUID_RE.test(sarId)
                        ? vvnService.getWithdrawnBySar(sarId, {})
                        : Promise.resolve([]),
            ]);
            setCounts({ inprogress: inprog.length, submitted: subm.length, accepted: acc.length, withdrawn: wdr.length });
        } catch {}
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [tab, admin]);

    useEffect(() => {
        const h = setTimeout(() => {
            load();
            loadCounts();
        }, 350);
        return () => clearTimeout(h);
        // eslint-disable-next-line
    }, [sarId, specificRep, imo, eta, etd, submittedDate, acceptedDate, admin]);

    const filtered = useMemo(() => vvns, [vvns]);

    // === AÇÕES ===
    async function doSubmit(v: VesselVisitNotificationDto) {
        await runWithLoading(vvnService.submitById(v.id));
        toast.success(t("vvn.toast.submitSuccess") as string);
        load();
        loadCounts();
    }
    async function doWithdraw(v: VesselVisitNotificationDto) {
        await runWithLoading(vvnService.withdrawById(v.id));
        toast.success(t("vvn.toast.withdrawSuccess") as string);
        load();
        loadCounts();
    }

    async function doReject() {
        if (!selected) return;
        if (!rejectMsg.trim()) {
            toast.error(t("vvn.modals.reject.placeholder") as string);
            return;
        }
        const dto: RejectVesselVisitNotificationDto = { vvnCode: selected.code, reason: rejectMsg.trim() };
        await runWithLoading(vvnService.rejectByCode(dto));
        setRejectOpen(false);
        setRejectMsg("");
        toast.success(t("vvn.toast.rejectSuccess") as string);
        load();
        loadCounts();
    }

    async function doUpdate() {
        if (!selected) return;
        const dto: UpdateVesselVisitNotificationDto = {
            volume: updVolume === "" ? undefined : Number(updVolume),
            dock: updDock.trim() || undefined,
        };
        await runWithLoading(vvnService.updateVvn(selected.id, dto));
        setUpdOpen(false);
        toast.success(t("vvn.toast.updateSuccess") as string);
        load();
    }

    /* RENDER */
    return (
        <div className="sa-wrapper">
            {/* HEADER com contagens */}
            <div className="vt-title-area vvn-header-tight">
                <div className="vvn-header-left">
                    <h2 className="vt-title">
                        <FaShip /> {t("vvn.title") || "Vessel Visit Notifications"}
                    </h2>
                    <div className="vvn-counters">
                        <span className="vvn-chip vvn-chip-inp">{t("vvn.header.inprogress", { count: counts.inprogress })}</span>
                        <span className="vvn-chip vvn-chip-sub">{t("vvn.header.submitted", { count: counts.submitted })}</span>
                        <span className="vvn-chip vvn-chip-acc">{t("vvn.header.accepted", { count: counts.accepted })}</span>
                        <span className="vvn-chip vvn-chip-wdr">{t("vvn.header.withdrawn", { count: counts.withdrawn })}</span>
                    </div>
                </div>
                <div className="vvn-header-right">
                    <button className="vt-create-btn-top" onClick={() => toast(t("vvn.new") as string)}>
                        <FaPlus /> {t("vvn.new") || "Nova VVN"}
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="vvn-tabs">
                {(["inprogress", "submitted", "accepted", "withdrawn"] as TabKey[]).map((k) => (
                    <button key={k} className={`vvn-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
                        {tabLabel(k)}
                    </button>
                ))}
            </div>

            {/* FILTROS */}
            <div className="vvn-filters">
                <div className="sa-field small">
                    <label>{t("vvn.filters.specificRepGuid")}</label>
                    <input className="sa-input" value={specificRep} onChange={(e) => setSpecificRep(e.target.value)} />
                </div>
                <div className="sa-field small">
                    <label>{t("vvn.filters.imo")}</label>
                    <input className="sa-input" value={imo} onChange={(e) => setImo(e.target.value)} />
                </div>
                <div className="sa-field small">
                    <label>{t("vvn.filters.eta")}</label>
                    <input type="date" className="sa-input" value={eta} onChange={(e) => setEta(e.target.value)} />
                </div>
                <div className="sa-field small">
                    <label>{t("vvn.filters.etd")}</label>
                    <input type="date" className="sa-input" value={etd} onChange={(e) => setEtd(e.target.value)} />
                </div>
                {tab !== "inprogress" && tab !== "withdrawn" && (
                    <div className="sa-field small">
                        <label>{t("vvn.filters.submitted")}</label>
                        <input type="date" className="sa-input" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} />
                    </div>
                )}
                {tab === "accepted" && (
                    <div className="sa-field small">
                        <label>{t("vvn.filters.accepted")}</label>
                        <input type="date" className="sa-input" value={acceptedDate} onChange={(e) => setAcceptedDate(e.target.value)} />
                    </div>
                )}
            </div>

            {/* LISTA + DETALHE */}
            <div className="vvn-grid">
                <aside className="vvn-list">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <div className="vvn-skel" key={i} />)
                    ) : filtered.length === 0 ? (
                        <div className="sa-empty">{t("vvn.list.empty")}</div>
                    ) : (
                        filtered.map((v) => {
                            const active = v.id === selected?.id;
                            const statusKey = `v-${(v.status || "").toLowerCase()}`;
                            return (
                                <button key={v.id} className={`vvn-item ${active ? "active" : ""}`} onClick={() => setSelected(v)}>
                                    <div className="vvn-item-top">
                                        <strong>{v.code}</strong>
                                        <span className={`vvn-status ${statusKey}`}>{v.status}</span>
                                    </div>
                                    <div className="vvn-item-sub">
                                        IMO {v.vesselImo} · ETA {shortDT(v.estimatedTimeArrival)} · ETD {shortDT(v.estimatedTimeDeparture)}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </aside>

                <main className="vvn-main">
                    {!selected ? (
                        <div className="sa-empty">{t("common.selectOne")}</div>
                    ) : (
                        <>
                            <div className="vvn-head">
                                <div>
                                    <h3 className="vvn-title">{selected.code}</h3>
                                    <div className="vvn-sub">
                                        IMO {selected.vesselImo} • {t("vvn.details.status")}: <b>{selected.status}</b>
                                    </div>
                                </div>

                                {/* BOTÕES: Submit / Withdraw (sem Accept) */}
                                <div className="vvn-actions">
                                    {(() => {
                                        const s = (selected.status || "").toString().toLowerCase();
                                        const canSubmitOrWithdraw = s.includes("inprogress") || s.includes("pending");
                                        return canSubmitOrWithdraw ? (
                                            <>
                                                <button className="sa-btn sa-btn-primary" onClick={() => doSubmit(selected)} title={t("vvn.actions.submit") as string}>
                                                    <FaPaperPlane /> {t("vvn.actions.submit")}
                                                </button>
                                                <button className="sa-btn sa-btn-danger" onClick={() => doWithdraw(selected)} title={t("vvn.actions.withdraw") as string}>
                                                    <FaArrowRotateLeft /> {t("vvn.actions.withdraw")}
                                                </button>
                                            </>
                                        ) : (
                                            <span className="sa-note">{t("vvn.actions.noActionsForState")}</span>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* KPIs */}
                            <section className="vvn-kpis">
                                <div className="sa-card">
                                    <div className="sa-card-title">{t("vvn.details.eta")}</div>
                                    <div className="sa-card-value">{fmtDT(selected.estimatedTimeArrival)}</div>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">{t("vvn.details.etd")}</div>
                                    <div className="sa-card-value">{fmtDT(selected.estimatedTimeDeparture)}</div>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">{t("vvn.details.volume")}</div>
                                    <div className="sa-card-value">{selected.volume}</div>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">{t("vvn.details.dock")}</div>
                                    <div className="sa-card-value">{selected.dock || "-"}</div>
                                </div>
                            </section>

                            {/* AÇÕES DETALHE: abrir popups */}
                            <div className="vvn-quick-grid">
                                <button className="vvn-tile is-crew" onClick={() => setCrewOpen(true)}>
                                    <span className="vvn-ico">🧑‍✈️</span>
                                    <span className="vvn-text">
                    <b>{t("vvn.modals.crew.title")}</b>
                    <span> {t("vvn.modals.crew.title").toString().includes("Crew") ? "view crew" : "ver tripulação"}</span>
                  </span>
                                </button>

                                <button className="vvn-tile is-loading" onClick={() => setLoadOpen(true)}>
                                    <span className="vvn-ico">📦</span>
                                    <span className="vvn-text">
                    <b>{t("vvn.modals.loading.title")}</b>
                    <span> {t("vvn.modals.loading.empty").toString().includes("No") ? "loading containers" : "containers de embarque"}</span>
                  </span>
                                </button>

                                <button className="vvn-tile is-unloading" onClick={() => setUnloadOpen(true)}>
                                    <span className="vvn-ico">📤</span>
                                    <span className="vvn-text">
                    <b>{t("vvn.modals.unloading.title")}</b>
                    <span> {t("vvn.modals.unloading.empty").toString().includes("No") ? "unloading" : "desembarque"}</span>
                  </span>
                                </button>

                                <button className="vvn-tile is-tasks" onClick={() => setTasksOpen(true)}>
                                    <span className="vvn-ico">✅</span>
                                    <span className="vvn-text">
                    <b>{t("vvn.modals.tasks.title")}</b>
                    <span> {t("vvn.modals.tasks.empty").toString().includes("No") ? "open" : "em aberto"}</span>
                  </span>
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* ======= POPUPS ======= */}

            {/* Crew Manifest */}
            {crewOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setCrewOpen(false)}>
                    <div className="vvn-pop-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.crew.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setCrewOpen(false)}>
                                ✖
                            </button>
                        </div>
                        {!selected.crewManifest ? (
                            <div className="sa-empty">{t("vvn.modals.crew.empty")}</div>
                        ) : (
                            <>
                                <div className="vvn-def">
                                    <div>
                                        <span>{t("vvn.modals.crew.captain")}</span>
                                        <strong>{selected.crewManifest.captainName}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.crew.total")}</span>
                                        <strong>{selected.crewManifest.totalCrew}</strong>
                                    </div>
                                </div>
                                <div className="vvn-table-wrap">
                                    <table className="vvn-table">
                                        <thead>
                                        <tr>
                                            <th>{t("vvn.modals.crew.table.name")}</th>
                                            <th>{t("vvn.modals.crew.table.role")}</th>
                                            <th>{t("vvn.modals.crew.table.nationality")}</th>
                                            <th>{t("vvn.modals.crew.table.citizenId")}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(selected.crewManifest.crewMembers || []).map((m: CrewMemberDto) => (
                                            <tr key={m.id}>
                                                <td>{m.name}</td>
                                                <td>{m.role}</td>
                                                <td>{m.nationality}</td>
                                                <td>{m.citizenId}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Loading Cargo Manifest */}
            {loadOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setLoadOpen(false)}>
                    <div className="vvn-pop-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.loading.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setLoadOpen(false)}>
                                ✖
                            </button>
                        </div>
                        {!selected.loadingCargoManifest ? (
                            <div className="sa-empty">{t("vvn.modals.loading.empty")}</div>
                        ) : (
                            <>
                                <div className="vvn-def">
                                    <div>
                                        <span>{t("vvn.modals.loading.code")}</span>
                                        <strong>{selected.loadingCargoManifest.code}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.loading.type")}</span>
                                        <strong>{selected.loadingCargoManifest.type}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.loading.created")}</span>
                                        <strong>{fmtDT(selected.loadingCargoManifest.createdAt)}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.loading.createdBy")}</span>
                                        <strong>{selected.loadingCargoManifest.createdBy}</strong>
                                    </div>
                                </div>
                                <EntriesTable entries={selected.loadingCargoManifest.entries} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Unloading Cargo Manifest */}
            {unloadOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setUnloadOpen(false)}>
                    <div className="vvn-pop-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.unloading.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setUnloadOpen(false)}>
                                ✖
                            </button>
                        </div>
                        {!selected.unloadingCargoManifest ? (
                            <div className="sa-empty">{t("vvn.modals.unloading.empty")}</div>
                        ) : (
                            <>
                                <div className="vvn-def">
                                    <div>
                                        <span>{t("vvn.modals.unloading.code")}</span>
                                        <strong>{selected.unloadingCargoManifest.code}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.unloading.type")}</span>
                                        <strong>{selected.unloadingCargoManifest.type}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.unloading.created")}</span>
                                        <strong>{fmtDT(selected.unloadingCargoManifest.createdAt)}</strong>
                                    </div>
                                    <div>
                                        <span>{t("vvn.modals.unloading.createdBy")}</span>
                                        <strong>{selected.unloadingCargoManifest.createdBy}</strong>
                                    </div>
                                </div>
                                <EntriesTable entries={selected.unloadingCargoManifest.entries} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Tasks */}
            {tasksOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setTasksOpen(false)}>
                    <div className="vvn-pop-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.tasks.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setTasksOpen(false)}>
                                ✖
                            </button>
                        </div>
                        {!selected.tasks || selected.tasks.length === 0 ? (
                            <div className="sa-empty">{t("vvn.modals.tasks.empty")}</div>
                        ) : (
                            <ul className="vvn-task-list">
                                {selected.tasks.map((tk) => (
                                    <li key={tk.id}>
                                        <b>{tk.title}</b>
                                        {tk.status ? <span className="vvn-task-status"> · {tk.status}</span> : null}
                                        {tk.description ? <div className="vvn-task-desc">{tk.description}</div> : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* MODAIS EXTRA (Reject/Update) — opcionais */}
            {rejectOpen && (
                <div className="sa-modal-backdrop" onClick={() => setRejectOpen(false)}>
                    <div className="vvn-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.reject.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setRejectOpen(false)}>
                                ✖
                            </button>
                        </div>
                        <div className="vvn-modal-body">
              <textarea
                  className="sa-textarea"
                  placeholder={t("vvn.modals.reject.placeholder") as string}
                  value={rejectMsg}
                  onChange={(e) => setRejectMsg(e.target.value)}
              />
                        </div>
                        <div className="vvn-modal-actions">
                            <button className="sa-btn sa-btn-cancel" onClick={() => setRejectOpen(false)}>
                                {t("common.cancel")}
                            </button>
                            <button className="sa-btn sa-btn-danger" onClick={doReject}>
                                {t("common.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {updOpen && (
                <div className="sa-modal-backdrop" onClick={() => setUpdOpen(false)}>
                    <div className="vvn-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">{t("vvn.modals.update.title")}</h3>
                            <button className="sa-icon-btn sa-dock-close" onClick={() => setUpdOpen(false)}>
                                ✖
                            </button>
                        </div>
                        <div className="vvn-modal-body grid2">
                            <div className="sa-field">
                                <label>{t("vvn.modals.update.volume")}</label>
                                <input
                                    className="sa-input"
                                    type="number"
                                    min={0}
                                    value={updVolume}
                                    onChange={(e) => setUpdVolume(e.target.value)}
                                />
                            </div>
                            <div className="sa-field">
                                <label>{t("vvn.modals.update.dock")}</label>
                                <input className="sa-input" value={updDock} onChange={(e) => setUpdDock(e.target.value.toUpperCase())} />
                            </div>
                        </div>
                        <div className="vvn-modal-actions">
                            <button className="sa-btn sa-btn-cancel" onClick={() => setUpdOpen(false)}>
                                {t("common.cancel")}
                            </button>
                            <button className="sa-btn sa-btn-primary" onClick={doUpdate}>
                                {t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* Tabela de entries de cargo manifest */
function EntriesTable({ entries }: { entries: CargoManifestEntryDto[] }) {
    const { t } = useTranslation();
    if (!entries || entries.length === 0) return <div className="sa-empty">{t("vvn.modals.loading.empty")}</div>;
    return (
        <div className="vvn-table-wrap">
            <table className="vvn-table">
                <thead>
                <tr>
                    <th>{t("vvn.entriesTable.storageArea")}</th>
                    <th>{t("vvn.entriesTable.position")}</th>
                    <th>{t("vvn.entriesTable.iso")}</th>
                    <th>{t("vvn.entriesTable.type")}</th>
                    <th>{t("vvn.entriesTable.status")}</th>
                    <th>{t("vvn.entriesTable.weight")}</th>
                </tr>
                </thead>
                <tbody>
                {entries.map((e) => (
                    <tr key={e.id}>
                        <td>{e.storageAreaName}</td>
                        <td>{`Bay ${e.bay} · Row ${e.row} · Tier ${e.tier}`}</td>
                        <td>{isoString(e.container?.isoCode)}</td>
                        <td>{e.container?.type ?? "-"}</td>
                        <td>{e.container?.status ?? "-"}</td>
                        <td>{e.container?.weightKg ?? 0}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
