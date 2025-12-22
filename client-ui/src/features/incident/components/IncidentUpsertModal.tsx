import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import "../style/incidents.css";
import type { Incident, ImpactMode, Severity } from "../domain/incident";
import type { CreateIncidentDTO } from "../dtos/createIncidentDTO";
import type { UpdateIncidentDTO } from "../dtos/updateIncidentDTO";
import { createIncident, updateIncident, getAllVVEs } from "../services/incidentService";
import { getAllIncidentTypes } from "../../incidentTypes/services/incidentTypeService"
import type {IncidentType} from "../../incidentTypes/domain/incidentType.ts";

const severities: Severity[] = ["Minor", "Major", "Critical"];
const impactModes: ImpactMode[] = ["Specific", "AllOnGoing", "Upcoming"];

const emptyCreate: CreateIncidentDTO = {
    code: "",
    incidentTypeCode: "",
    vveList: [],
    startTime: new Date().toISOString(),
    endTime: null,
    severity: "Minor",
    impactMode: "Specific",
    description: "",
    createdByUser: "",
    upcomingWindowStartTime: null,
    upcomingWindowEndTime: null,
};

export default function IncidentUpsertModal({
                                                isOpen,
                                                mode,
                                                onClose,
                                                onSaved,
                                                resource,
                                            }: {
    isOpen: boolean;
    mode: "create" | "edit";
    onClose: () => void;
    onSaved: (it: Incident) => void;
    resource?: Incident | null;
}) {
    const { t } = useTranslation();

    const [data, setData] = useState<CreateIncidentDTO>(emptyCreate);
    const [busy, setBusy] = useState(false);

    // VVE Selection State
    const [allVves, setAllVves] = useState<string[]>([]); // Lista vinda do backend
    const [vveSearch, setVveSearch] = useState(""); // Filtro de pesquisa
    const [loadingVves, setLoadingVves] = useState(false);

    const [allIncidentsTypes, setAllIncidentsTypes] = useState<IncidentType[]>([]);
    const [loadingIncidentTypes, setLoadingIncidentTypes] = useState(false);
    const [incidentTypeSearch, setIncidentTypeSearch] = useState("");

    // Carregar dados ao abrir
    useEffect(() => {
        if (!isOpen) return;

        // 1. Carregar lista de VVEs do backend
        setLoadingVves(true);
        getAllVVEs()
            .then((list) => setAllVves(list))
            .catch(() => toast.error("Falha ao carregar lista de VVEs"))
            .finally(() => setLoadingVves(false));

        setLoadingIncidentTypes(true);
        getAllIncidentTypes()
            .then((list) => setAllIncidentsTypes(list))
            .catch(() => toast.error("Falha ao carregar lista de Incidents Types"))
            .finally(() => setLoadingIncidentTypes(false));


        // 2. Preencher formulário
        if (mode === "edit" && resource) {
            setData({
                code: resource.code,
                incidentTypeCode: resource.incidentTypeCode,
                vveList: resource.vveList ?? [],
                startTime: resource.startTime,
                endTime: resource.endTime ?? null,
                severity: resource.severity,
                impactMode: resource.impactMode,
                description: resource.description ?? "",
                createdByUser: resource.createdByUser ?? "",
                upcomingWindowStartTime: resource.upcomingWindowStartTime ?? null,
                upcomingWindowEndTime: resource.upcomingWindowEndTime ?? null,
            });
        } else {
            setData(emptyCreate);
        }
        setVveSearch(""); // Limpa pesquisa ao reabrir
        setIncidentTypeSearch("");
    }, [isOpen, mode, resource]);

    const isUpcoming = data.impactMode === "Upcoming";
    const isAllOngoing = data.impactMode === "AllOnGoing";
    const isSpecific = data.impactMode === "Specific";

    const onField = (name: keyof CreateIncidentDTO, value: any) => setData((p) => ({ ...p, [name]: value }));

    // Helper: Toggle VVE Selection
    const toggleVve = (vveCode: string) => {
        setData((prev) => {
            const currentList = prev.vveList || [];
            if (currentList.includes(vveCode)) {
                return { ...prev, vveList: currentList.filter((c) => c !== vveCode) }; // Remove
            } else {
                return { ...prev, vveList: [...currentList, vveCode] }; // Adiciona
            }
        });
    };

    const toggleIncidentType = (code: string) => {
        setData((prev) => ({
            ...prev,
            incidentTypeCode: prev.incidentTypeCode === code ? "" : code,
        }));
    };

    // Filtered List based on Search
    const filteredVves = allVves.filter((v) =>
        v.toLowerCase().includes(vveSearch.toLowerCase())
    );

    const filteredIncidentTypes = allIncidentsTypes.filter((it) => {
        const q = incidentTypeSearch.toLowerCase();
        return it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q);
    });


    const validate = (): string | null => {
        if (mode === "create" && !data.code.trim()) return t("incident.errors.codeRequired");
        if (!data.incidentTypeCode.trim()) return t("incident.errors.typeRequired");
        if (!data.startTime) return t("incident.errors.startRequired");
        if (!data.description.trim()) return t("incident.errors.descRequired");

        if (isSpecific && (!data.vveList || data.vveList.length < 1)) {
            return t("incident.errors.vveRequiredSpecific");
        }
        if (data.impactMode === "Upcoming") {
            if (!data.upcomingWindowStartTime || !data.upcomingWindowEndTime) return t("incident.errors.upcomingWindowRequired");
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }

        setBusy(true);
        try {
            const payloadBase = {
                incidentTypeCode: data.incidentTypeCode.trim(),
                vveList: isAllOngoing || isUpcoming ? [] : data.vveList, // Usa a lista selecionada
                startTime: data.startTime,
                endTime: data.endTime,
                severity: data.severity,
                impactMode: data.impactMode,
                description: data.description.trim(),
                upcomingWindowStartTime: isUpcoming ? data.upcomingWindowStartTime : null,
                upcomingWindowEndTime: isUpcoming ? data.upcomingWindowEndTime : null,
            };

            let saved: Incident;

            if (mode === "create") {
                saved = await createIncident({
                    ...payloadBase,
                    code: data.code.trim(),
                    createdByUser: data.createdByUser.trim() || "unknown",
                } as CreateIncidentDTO);
                toast.success(t("incident.success.created"));
            } else {
                saved = await updateIncident(resource!.code, payloadBase as UpdateIncidentDTO);
                toast.success(t("incident.success.updated"));
            }

            onSaved(saved);
            onClose();
        } catch (e2) {
            toast.error((e2 as Error).message || t("incident.errors.saveFailed"));
        } finally {
            setBusy(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="in-modal-overlay">
            <div className="in-modal">
                <div className="in-modal-head" style={{ marginBottom: "1.5rem" }}>
                    <div>
                        <h2 className="in-modal-title">
                            {mode === "create" ? t("incident.modal.createTitle") : t("incident.modal.editTitle")}
                        </h2>
                        <p className="in-modal-sub">
                            {mode === "create" ? t("incident.modal.createSub") : t("incident.modal.editSub")}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="in-form">
                    <div className="in-grid">

                        {mode === "create" ? (
                            <div className="in-group">
                                <label>{t("incident.form.code")}</label>
                                <input
                                    className="in-input"
                                    value={data.code}
                                    onChange={(e) => onField("code", e.target.value)}
                                    placeholder="Ex: INC-2025-001"
                                />
                            </div>
                        ) : (
                            <div className="in-group">
                                <label>{t("incident.form.code")}</label>
                                <input className="in-input" value={resource?.code ?? ""} disabled />
                            </div>
                        )}

                        <div className="in-group in-group-full">
                            <label>{t("incident.form.description")}</label>
                            <input
                                className="in-input"
                                value={data.description}
                                onChange={(e) => onField("description", e.target.value)}
                                placeholder={t("incident.form.descriptionPH")}
                            />
                        </div>

                        <div className="in-group">
                            <label>{t("incident.form.severity")}</label>
                            <select className="in-input" value={data.severity} onChange={(e) => onField("severity", e.target.value as Severity)}>
                                {severities.map((s) => (
                                    <option key={s} value={s}>
                                        {t(`incident.severity.${s}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="in-group">
                            <label>{t("incident.form.impactMode")}</label>
                            <select className="in-input" value={data.impactMode} onChange={(e) => onField("impactMode", e.target.value as ImpactMode)}>
                                {impactModes.map((m) => (
                                    <option key={m} value={m}>
                                        {t(`incident.impact.${m}`)}
                                    </option>
                                ))}
                            </select>
                        </div>


                        <div className="in-group">
                            <label>{t("incident.form.startTime")}</label>
                            <input
                                className="in-input"
                                type="datetime-local"
                                value={toLocalDatetimeValue(data.startTime)}
                                onChange={(e) => onField("startTime", fromLocalDatetimeValue(e.target.value))}
                            />
                        </div>

                        {mode === "create" && (
                            <div className="in-group">
                                <label>{t("incident.form.createdByUser")}</label>
                                <input
                                    className="in-input"
                                    value={data.createdByUser}
                                    onChange={(e) => onField("createdByUser", e.target.value)}
                                    placeholder="user@example.com"
                                />
                            </div>
                        )}

                        <div className="in-group in-group-full">
                            <label>{t("incident.form.typeCode")}</label>

                            {/* Chips do selecionado (opcional, mas consistente com VVE) */}
                            {data.incidentTypeCode && (
                                <div className="in-selected-area">
                                    <div className="in-chip">
                                        <span className="in-mono">{data.incidentTypeCode}</span>
                                        <button
                                            type="button"
                                            className="in-chip-x"
                                            onClick={() => onField("incidentTypeCode", "")}
                                            title={t("actions.clear")}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="in-vve-selector">
                                {/* Pesquisa (corrigida) */}
                                <input
                                    type="text"
                                    className="in-vve-search"
                                    placeholder={t("incident.form.typeSearchPH") ?? "Pesquisar Incident Type..."}
                                    value={incidentTypeSearch}
                                    onChange={(e) => setIncidentTypeSearch(e.target.value)}
                                />

                                {/* Lista com scroll */}
                                <div className="in-vve-list">
                                    {loadingIncidentTypes ? (
                                        <div style={{ padding: "1rem", color: "#999", fontSize: "0.85rem" }}>
                                            {t("common.loading")}
                                        </div>
                                    ) : filteredIncidentTypes.length === 0 ? (
                                        <div style={{ padding: "1rem", color: "#999", fontSize: "0.85rem" }}>
                                            {t("incident.errors.noIncidentTypes") ?? "Nenhuma Incident Type encontrada"}
                                        </div>
                                    ) : (
                                        filteredIncidentTypes.map((it) => {
                                            const isSelected = data.incidentTypeCode === it.code;

                                            return (
                                                <div
                                                    key={it.code}
                                                    className={`in-vve-item ${isSelected ? "is-selected" : ""}`}
                                                    onClick={() => toggleIncidentType(it.code)}
                                                >
                                                    <div className="in-checkbox-mock"></div>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                                        <span className="in-mono">{it.code}</span>
                                                        <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{it.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* --- SELETOR DE VVES MODERNO --- */}
                        <div className="in-group in-group-full">
                            <label>{t("incident.form.vveList")}</label>

                            {/* Se Impacto não for SPECIFIC, desativa e avisa */}
                            {!isSpecific ? (
                                <div className="in-input" style={{ background: "#f1f5f9", color: "#94a3b8" }}>
                                    {isAllOngoing
                                        ? t("incident.form.vveIgnoredAllOngoing")
                                        : t("incident.form.vveAutoUpcoming")}
                                </div>
                            ) : (
                                <>
                                    {/* Chips dos Selecionados */}
                                    {data.vveList.length > 0 && (
                                        <div className="in-selected-area">
                                            {data.vveList.map((vve) => (
                                                <div key={vve} className="in-chip">
                                                    <span className="in-mono">{vve}</span>
                                                    <button type="button" className="in-chip-x" onClick={() => toggleVve(vve)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Componente de Seleção */}
                                    <div className="in-vve-selector">
                                        {/* Barra de Pesquisa */}
                                        <input
                                            type="text"
                                            className="in-vve-search"
                                            placeholder="Pesquisar VVE..."
                                            value={vveSearch}
                                            onChange={(e) => setVveSearch(e.target.value)}
                                        />

                                        {/* Lista com Scroll */}
                                        <div className="in-vve-list">
                                            {loadingVves ? (
                                                <div style={{ padding: "1rem", color: "#999", fontSize:"0.85rem" }}>Carregando...</div>
                                            ) : filteredVves.length === 0 ? (
                                                <div style={{ padding: "1rem", color: "#999", fontSize:"0.85rem" }}>Nenhuma VVE encontrada</div>
                                            ) : (
                                                filteredVves.map((vve) => {
                                                    const isSelected = data.vveList.includes(vve);
                                                    return (
                                                        <div
                                                            key={vve}
                                                            className={`in-vve-item ${isSelected ? "is-selected" : ""}`}
                                                            onClick={() => toggleVve(vve)}
                                                        >
                                                            <div className="in-checkbox-mock"></div>
                                                            {vve}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {isUpcoming && (
                            <>
                                <div className="in-group">
                                    <label>{t("incident.form.upcomingStart")}</label>
                                    <input
                                        className="in-input"
                                        type="datetime-local"
                                        value={data.upcomingWindowStartTime ? toLocalDatetimeValue(data.upcomingWindowStartTime) : ""}
                                        onChange={(e) => onField("upcomingWindowStartTime", e.target.value ? fromLocalDatetimeValue(e.target.value) : null)}
                                    />
                                </div>

                                <div className="in-group">
                                    <label>{t("incident.form.upcomingEnd")}</label>
                                    <input
                                        className="in-input"
                                        type="datetime-local"
                                        value={data.upcomingWindowEndTime ? toLocalDatetimeValue(data.upcomingWindowEndTime) : ""}
                                        onChange={(e) => onField("upcomingWindowEndTime", e.target.value ? fromLocalDatetimeValue(e.target.value) : null)}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="in-modal-actions">
                        <button type="button" className="in-btn in-btn-ghost" onClick={onClose}>
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" className="in-btn in-btn-primary" disabled={busy}>
                            {busy ? t("common.saving") : mode === "create" ? t("actions.create") : t("actions.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function toLocalDatetimeValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalDatetimeValue(v: string) {
    const d = new Date(v);
    return d.toISOString();
}