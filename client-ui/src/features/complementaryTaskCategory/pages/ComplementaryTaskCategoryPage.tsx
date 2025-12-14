import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaTasks } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../style/complementaryTaskCategory.css";

import {
    getAllCTC,
    getCTCByCode,
    getCTCByName,
    getCTCByDescription,
    getCTCByCategory
} from "../services/complementaryTaskCategoryService";

import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";
import ComplementaryTaskCategoryTable from "../components/ComplementaryTaskCategoryTable";
import ComplementaryTaskCategorySearch from "../components/ComplementaryTaskCategorySearch";
import ComplementaryTaskCategoryCreateModal from "../components/ComplementaryTaskCategoryCreateModal";


type FilterType = "all" | "code" | "name" | "description" | "category";

function ComplementaryTaskCategoryPage() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllCTC();
            setCategories(data);
        } catch (err) {
            setError(err as Error);
            toast.error(t("ctc.errors.loadAll"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: FilterType, value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            let data: ComplementaryTaskCategory[] = [];
            switch (type) {
                case "code":
                    const result = await getCTCByCode(value);
                    data = result ? [result] : [];
                    break;
                case "name":
                    data = await getCTCByName(value);
                    break;
                case "description":
                    data = await getCTCByDescription(value);
                    break;
                case "category":
                    data = await getCTCByCategory(value);
                    break;
                case "all":
                default:
                    await loadCategories();
                    return;
            }
            setCategories(data);
        } catch (err) {
            setError(err as Error);
            setCategories([]);
            toast.error(t("ctc.errors.search"));
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = categories.length;
        const active = categories.filter(c => c.isActive).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [categories]);

    return (
        <div className="ctc-page-container">
            <div className="ctc-header">
                <Link to="/dashboard" className="ctc-back-button" title={t("actions.backToDashboard")}>
                    ‹
                </Link>
                <h1>
                    <FaTasks className="ctc-icon" /> {t("ctc.title")}
                </h1>
            </div>

            <div className="ctc-controls-container">
                <div className="ctc-stats-grid">
                    <div className="ctc-stat-card total">
                        <span className="stat-icon">📋</span>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-title">{t("ctc.stats.total")}</span>
                    </div>
                    <div className="ctc-stat-card active">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{stats.active}</span>
                        <span className="stat-title">{t("ctc.stats.active")}</span>
                    </div>
                    <div className="ctc-stat-card inactive">
                        <span className="stat-icon">🚫</span>
                        <span className="stat-value">{stats.inactive}</span>
                        <span className="stat-title">{t("ctc.stats.inactive")}</span>
                    </div>
                </div>

                <div className="ctc-action-box">
                    <ComplementaryTaskCategorySearch onSearch={handleSearch} />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="create-ctc-button"
                    >
                        {t("ctc.createButton")}
                    </button>
                </div>
            </div>

            {isLoading && <p>{t("common.loading")}</p>}
            {error && <p className="error-message">{error.message}</p>}

            <ComplementaryTaskCategoryTable
                categories={categories}
                onDetails={(c) => console.log("Details", c)} // Implementar modal de detalhes se necessário
            />

            <ComplementaryTaskCategoryCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    loadCategories();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
}

export default ComplementaryTaskCategoryPage;