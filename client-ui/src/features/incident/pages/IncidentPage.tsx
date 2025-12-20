import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

import "../style/incidents.css";
import type { Incident, Severity } from "../domain/incident";
import {
    getAllIncidents,
    getActiveIncidents,
    getResolvedIncidents,
    getIncidentsBySeverity,
    getIncidentsByDateRange,
    getIncidentsByVVE,
    getIncidentByCode,
} from "../services/incidentService";

import IncidentTable from "../components/IncidentTable";
import IncidentDetailsPanel from "../components/IncidentDetailsPanel";
import IncidentUpsertModal from "../components/IncidentUpsertModal";

type FilterType = "all" | "active" | "resolved" | "code" | "severity" | "dateRange" | "vve";

export default function IncidentPage() {
    const { t } = useTranslation();
    const didMountRef = useRef(false);

    const [items, setItems] = useState<Incident[]>([]);
    const [selected, setSelected] = useState<Incident | null>(null);
    const [selectedCode, setSelectedCode] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // filters
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [filterValue, setFilterValue] = useState("");
    const [rangeStart, setRangeStart] = useState("");
    const [rangeEnd, setRangeEnd] = useState("");

    // modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editing, setEditing] = useState<Incident | null>(null);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            loadAll();
        }
    }, []);

    const loadAll = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllIncidents();
            setItems(data);
        } catch (e) {
            setError(e as Error);
            toast.error(t("incident.errors.loadAll"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (it: Incident) => {
        setSelected(it);
        setSelectedCode(it.code);
    };

    const handleCloseDetails = () => {
        setSelected(null);
        setSelectedCode(null);
    };

    const stats = useMemo(() => {
        const total = items.length;
        const active = items.filter((i) => !i.endTime).length;
        const resolved = total - active;
        return { total, active, resolved };
    }, [items]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let data: Incident[] = [];
            switch (filterType) {
                case "all": data = await getAllIncidents(); break;
                case "active": data = await getActiveIncidents(); break;
                case "resolved": data = await getResolvedIncidents(); break;
                case "code": {
                    if (!filterValue.trim()) throw new Error(t("errors.emptySearch"));
                    const one = await getIncidentByCode(filterValue.trim());
                    data = one ? [one] : [];
                    break;
                }
                case "severity": {
                    if (!filterValue.trim()) throw new Error(t("errors.emptySearch"));
                    data = await getIncidentsBySeverity(filterValue.trim() as Severity);
                    break;
                }
                case "vve": {
                    if (!filterValue.trim()) throw new Error(t("errors.emptySearch"));
                    data = await getIncidentsByVVE(filterValue.trim());
                    break;
                }
                case "dateRange": {
                    if (!rangeStart || !rangeEnd) throw new Error(t("incident.errors.rangeRequired"));
                    data = await getIncidentsByDateRange(new Date(rangeStart).toISOString(), new Date(rangeEnd).toISOString());
                    break;
                }
                default: data = await getAllIncidents(); break;
            }
            setItems(data);
            if (data.length === 1) handleSelect(data[0]);
        } catch (e2) {
            setError(e2 as Error);
            setItems([]);
            toast.error((e2 as Error).message || t("incident.errors.search"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (it: Incident) => {
        setEditing(it);
        setIsEditOpen(true);
    };

    const afterSave = (saved: Incident) => {
        setItems((prev) => {
            const idx = prev.findIndex((x) => x.code === saved.code);
            if (idx === -1) return [saved, ...prev];
            const next = [...prev];
            next[idx] = saved;
            return next;
        });
        // Atualiza o selecionado se estiver aberto
        if (selectedCode === saved.code) {
            setSelected(saved);
        }
    };

    const afterDelete = (code: string) => {
        setItems((prev) => prev.filter((x) => x.code !== code));
        if (selectedCode === code) handleCloseDetails();
    };

    return (
        <div className="in-page">
            <div className="in-header">
                <Link to="/dashboard" className="in-back" title={t("actions.backToDashboard")}>‹</Link>
                <h1 className="in-h1">
                    <FaExclamationTriangle className="in-icon" /> {t("incident.title")}
                </h1>
                <button className="in-btn in-btn-primary" onClick={() => setIsCreateOpen(true)}>
                    {t("incident.actions.create")}
                </button>
            </div>

            <div className="in-top">
                <div className="in-stats">
                    <div className="in-stat">
                        <div className="in-stat-val">{stats.total}</div>
                        <div className="in-stat-label">{t("incident.stats.total")}</div>
                    </div>
                    <div className="in-stat">
                        <div className="in-stat-val">{stats.active}</div>
                        <div className="in-stat-label">{t("incident.stats.active")}</div>
                    </div>
                    <div className="in-stat">
                        <div className="in-stat-val">{stats.resolved}</div>
                        <div className="in-stat-label">{t("incident.stats.resolved")}</div>
                    </div>
                </div>

                <div className="in-filter-card">
                    <form onSubmit={handleSearch} className="in-filter-form">
                        <select className="in-input" value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)}>
                            <option value="all">{t("incident.filter.all")}</option>
                            <option value="active">{t("incident.filter.active")}</option>
                            <option value="resolved">{t("incident.filter.resolved")}</option>
                            <option value="code">{t("incident.filter.code")}</option>
                            <option value="severity">{t("incident.filter.severity")}</option>
                            <option value="vve">{t("incident.filter.vve")}</option>
                            <option value="dateRange">{t("incident.filter.dateRange")}</option>
                        </select>

                        {filterType === "dateRange" ? (
                            <>
                                <input className="in-input" type="datetime-local" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                                <input className="in-input" type="datetime-local" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                            </>
                        ) : filterType === "severity" ? (
                            <select className="in-input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                                <option value="Minor">{t("incident.severity.Minor")}</option>
                                <option value="Major">{t("incident.severity.Major")}</option>
                                <option value="Critical">{t("incident.severity.Critical")}</option>
                            </select>
                        ) : (filterType !== "all" && filterType !== "active" && filterType !== "resolved") ? (
                            <input
                                className="in-input"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                placeholder={t(`incident.filter.placeholder.${filterType}`)}
                            />
                        ) : null}

                        <button className="in-btn in-btn-ghost" type="submit" disabled={isLoading}>
                            {isLoading ? t("common.loading") : t("actions.search")}
                        </button>
                        <button className="in-btn in-btn-ghost" type="button" onClick={() => { setFilterType("all"); loadAll(); }}>
                            {t("actions.clear")}
                        </button>
                    </form>
                </div>
            </div>

            {error && <div className="in-error">{error.message}</div>}

            {/* Tabela Full Width */}
            <div className="in-table-container">
                <IncidentTable
                    items={items}
                    selectedCode={selectedCode}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                />
            </div>

            {/* Modal de Detalhes (Sobreposto) */}
            {selected && (
                <div className="in-details-overlay" onClick={handleCloseDetails}>
                    <div className="in-details-modal" onClick={(e) => e.stopPropagation()}>
                        <IncidentDetailsPanel
                            selected={selected}
                            onChanged={afterSave}
                            onDeleted={afterDelete}
                            onClose={handleCloseDetails}
                        />
                    </div>
                </div>
            )}

            {/* Modais de Criação/Edição */}
            <IncidentUpsertModal
                isOpen={isCreateOpen}
                mode="create"
                onClose={() => setIsCreateOpen(false)}
                onSaved={afterSave}
            />
            {editing && (
                <IncidentUpsertModal
                    isOpen={isEditOpen}
                    mode="edit"
                    resource={editing}
                    onClose={() => { setIsEditOpen(false); setEditing(null); }}
                    onSaved={afterSave}
                />
            )}
        </div>
    );
}