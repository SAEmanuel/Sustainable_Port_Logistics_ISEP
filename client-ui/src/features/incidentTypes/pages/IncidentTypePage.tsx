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
    getIncidentTypeSubtree,
} from "../services/incidentTypeService";

import IncidentTypeTable from "../components/IncidentTypeTable";
import IncidentTypeSearch from "../components/IncidentTypeSearch";
import IncidentTypeCreateModal from "../components/IncidentTypeCreateModal";
import IncidentTypeEditModal from "../components/IncidentTypeEditModal";
import IncidentTypeHierarchyPanel from "../components/IncidentTypeHierarchyPanel";

type FilterType = "roots" | "code" | "name" | "children" | "subtree";

function IncidentTypePage() {
    const { t } = useTranslation();
    const didMountRef = useRef(false);

    const [items, setItems] = useState<IncidentType[]>([]);

    // selection for hierarchy
    const [selected, setSelected] = useState<IncidentType | null>(null);
    const [selectedCode, setSelectedCode] = useState<string | null>(null);

    // modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // dedicated "editing" item (avoid fighting with hierarchy selection)
    const [editing, setEditing] = useState<IncidentType | null>(null);

    // main list loading/errors
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // subtree loading/errors
    const [subtree, setSubtree] = useState<IncidentType[]>([]);
    const [subtreeLoading, setSubtreeLoading] = useState(false);
    const [subtreeError, setSubtreeError] = useState<string | null>(null);

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

    const loadSubtree = async (code: string) => {
        setSubtreeLoading(true);
        setSubtreeError(null);
        try {
            const data = await getIncidentTypeSubtree(code);
            setSubtree(data);
        } catch (err) {
            setSubtree([]);
            setSubtreeError((err as Error)?.message ?? t("incidentType.errors.loadSubtree"));
            toast.error(t("incidentType.errors.loadSubtree"));
        } finally {
            setSubtreeLoading(false);
        }
    };

    const handleSelect = async (it: IncidentType) => {
        setSelected(it);
        setSelectedCode(it.code);
        await loadSubtree(it.code);
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

            // optional UX: if search returned a single item, auto-select + load its subtree
            if (data.length === 1) {
                await handleSelect(data[0]);
            }
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
        const roots = items.filter((i) => i.parentCode === null).length;
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
        setEditing(it);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditing(null);
        loadRoots();

        // optional: refresh subtree if the edited item is the selected one
        if (selectedCode) loadSubtree(selectedCode);
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

            <div className="it-content-grid">
                <div className="it-content-left">
                    <IncidentTypeTable
                        items={items}
                        onEdit={handleEdit}
                        onSelect={handleSelect}
                        selectedCode={selectedCode}
                    />
                </div>

                <div className="it-content-right">
                    <IncidentTypeHierarchyPanel
                        selected={selected}
                        subtree={subtree}
                        loading={subtreeLoading}
                        error={subtreeError}
                        onNodeSelect={(code) => {
                            const it = subtree.find((x) => x.code === code) ?? items.find((x) => x.code === code);
                            if (it) handleSelect(it);
                            else loadSubtree(code);
                        }}
                        onRefresh={() => selectedCode && loadSubtree(selectedCode)}
                    />
                </div>
            </div>

            <IncidentTypeCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    loadRoots();
                    setIsCreateModalOpen(false);
                }}
            />

            {editing && (
                <IncidentTypeEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdated={handleCloseEditModal}
                    resource={editing}
                />
            )}
        </div>
    );
}

export default IncidentTypePage;
