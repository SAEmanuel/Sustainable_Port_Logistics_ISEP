import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

import "../style/incidentType.css";

import type { IncidentType, Severity } from "../domain/incidentType";
import {
    getIncidentTypeRoots,
    getIncidentTypeByCode,
    getIncidentTypesByName,
    getIncidentTypeChildren,
    getIncidentTypeSubtree
} from "../services/incidentTypeService";

import IncidentTypeTable from "../components/IncidentTypeTable";
import IncidentTypeSearch from "../components/IncidentTypeSearch";
import IncidentTypeCreateModal from "../components/IncidentTypeCreateModal";
import IncidentTypeEditModal from "../components/IncidentTypeEditModal";

type FilterType = "roots" | "code" | "name" | "children" | "subtree";

function IncidentTypePage() {
    const { t } = useTranslation();
    const didMountRef = useRef(false);

    const [items, setItems] = useState<IncidentType[]>([]);
    const [selected, setSelected] = useState<IncidentType | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            loadRoots();
        }
    }, []);

    const loadRoots = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getIncidentTypeRoots();
            setItems(data);
        } catch (err) {
            setError(err as Error);
            toast.error(t("incidentType.errors.loadRoots"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: FilterType, value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            let data: IncidentType[] = [];

            switch (type) {
                case "roots":
                    await loadRoots();
                    return;

                case "code": {
                    const res = await getIncidentTypeByCode(value);
                    data = res ? [res] : [];
                    break;
                }

                case "name":
                    data = await getIncidentTypesByName(value);
                    break;

                case "children":
                    data = await getIncidentTypeChildren(value);
                    break;

                case "subtree":
                    data = await getIncidentTypeSubtree(value);
                    break;

                default:
                    await loadRoots();
                    return;
            }

            setItems(data);
        } catch (err) {
            setError(err as Error);
            setItems([]);
            toast.error(t("incidentType.errors.search"));
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = items.length;
        const roots = items.filter(i => i.parentCode === null).length;
        const nonRoots = total - roots;

        const bySeverity = items.reduce(
            (acc, it) => {
                acc[it.severity] = (acc[it.severity] ?? 0) + 1;
                return acc;
            },
            {} as Record<Severity, number>
        );

        return { total, roots, nonRoots, bySeverity };
    }, [items]);

    const handleEdit = (it: IncidentType) => {
        setSelected(it);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelected(null);
        loadRoots();
    };

    return (
        <div className="it-page-container">
            <div className="it-header">
                <Link to="/dashboard" className="it-back-button" title={t("actions.backToDashboard")}>
                    ‹
                </Link>

                <h1>
                    <FaExclamationTriangle className="it-icon" /> {t("incidentType.title")}
                </h1>
            </div>

            <div className="it-controls-container">
                <div className="it-stats-grid">
                    <div className="it-stat-card total">
                        <span className="stat-icon">📋</span>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-title">{t("incidentType.stats.total")}</span>
                    </div>

                    <div className="it-stat-card roots">
                        <span className="stat-icon">🌳</span>
                        <span className="stat-value">{stats.roots}</span>
                        <span className="stat-title">{t("incidentType.stats.roots")}</span>
                    </div>

                    <div className="it-stat-card children">
                        <span className="stat-icon">🧩</span>
                        <span className="stat-value">{stats.nonRoots}</span>
                        <span className="stat-title">{t("incidentType.stats.children")}</span>
                    </div>
                </div>

                <div className="it-action-box">
                    <IncidentTypeSearch onSearch={handleSearch} />
                    <button onClick={() => setIsCreateModalOpen(true)} className="create-it-button">
                        {t("incidentType.createButton")}
                    </button>
                </div>
            </div>

            {isLoading && <p>{t("common.loading")}</p>}
            {error && <p className="error-message">{error.message}</p>}

            <IncidentTypeTable items={items} onEdit={handleEdit} />

            <IncidentTypeCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    loadRoots();
                    setIsCreateModalOpen(false);
                }}
            />

            {selected && (
                <IncidentTypeEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdated={handleCloseEditModal}
                    resource={selected}
                />
            )}
        </div>
    );
}

export default IncidentTypePage;
