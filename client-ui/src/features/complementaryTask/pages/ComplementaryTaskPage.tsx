import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaTasks } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../style/complementaryTask.css";

import {
    getAllCT,
    getCTByCode,
    getCTByCategory,
    getCTByStaff,
    getCTByVve
} from "../services/complementaryTaskService";

import {
    getCTCById,
    getAllCTC
} from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";

import type { ComplementaryTask } from "../domain/complementaryTask";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";

import ComplementaryTaskTable from "../components/ComplementaryTaskTable";
import ComplementaryTaskSearch from "../components/ComplementaryTaskSearch";
import ComplementaryTaskCreateModal from "../components/ComplementaryTaskCreateModal";
import ComplementaryTaskEditModal from "../components/ComplementaryTaskEditModal";
import ComplementaryTaskCategoryDetailsModal from "../../complementaryTaskCategory/components/ComplementaryTaskCategoryDetailsModal";
import ComplementaryTaskFixCategoryModal from "../components/ComplementaryTaskFixCategoryModal";
import {BookAIcon} from "lucide-react";

type FilterType = "all" | "code" | "category" | "staff" | "vve";

function ComplementaryTaskPage() {
    const { t } = useTranslation();
    const didMountRef = useRef(false);

    const [tasks, setTasks] = useState<ComplementaryTask[]>([]);
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);

    const [selectedTask, setSelectedTask] = useState<ComplementaryTask | null>(null);
    const [viewCategory, setViewCategory] = useState<ComplementaryTaskCategory | null>(null);
    const [taskToFix, setTaskToFix] = useState<ComplementaryTask | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCategoryDetailsOpen, setIsCategoryDetailsOpen] = useState(false);
    const [isFixModalOpen, setIsFixModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            loadData();
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [tasksData, catsData] = await Promise.all([
                getAllCT(),
                getAllCTC()
            ]);

            setTasks(tasksData);
            setCategories(catsData);
        } catch (err) {
            setError(err as Error);
            toast.error(t("ct.errors.loadAll") || "Error loading data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: FilterType, value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            let data: ComplementaryTask[] = [];
            switch (type) {
                case "code":
                    try {
                        const result = await getCTByCode(value);
                        data = result ? [result] : [];
                    } catch {
                        data = [];
                    }
                    break;
                case "category":
                    data = await getCTByCategory(value);
                    break;
                case "staff":
                    data = await getCTByStaff(value);
                    break;
                case "vve":
                    data = await getCTByVve(value);
                    break;
                case "all":
                default:
                    await loadData();
                    return;
            }
            setTasks(data);
        } catch (err) {
            setError(err as Error);
            setTasks([]);
            toast.error(t("ct.errors.search") || "Search failed");
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = tasks.length;
        const scheduled = tasks.filter(t => t.status === "Scheduled").length;
        const inProgress = tasks.filter(t => t.status === "InProgress").length;
        const completed = tasks.filter(t => t.status === "Completed").length;
        return { total, scheduled, inProgress, completed };
    }, [tasks]);

    const handleEdit = (task: ComplementaryTask) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const handleViewCategory = async (categoryId: string) => {
        setIsLoading(true);
        try {
            const categoryData = await getCTCById(categoryId);
            setViewCategory(categoryData);
            setIsCategoryDetailsOpen(true);
        } catch {
            toast.error(t("ct.errors.loadCategory") || "Failed to load category details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFixCategory = (task: ComplementaryTask) => {
        setTaskToFix(task);
        setIsFixModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedTask(null);
        loadData();
    };

    return (
        <div className="ct-page-container">
            <div className="ct-header">
                <Link to="/dashboard" className="ct-back-button" title={t("actions.backToDashboard")}>
                    ‹
                </Link>
                <h1>
                    <BookAIcon className="ct-icon" /> {t("ct.title") || "Complementary Tasks"}
                </h1>
            </div>

            <div className="ct-controls-container">
                <div className="ct-stats-grid">
                    <div className="ct-stat-card total">
                        <span className="stat-icon">📋</span>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-title">{t("ct.stats.total") || "Total"}</span>
                    </div>
                    <div className="ct-stat-card warning">
                        <span className="stat-icon">⏳</span>
                        <span className="stat-value">{stats.scheduled}</span>
                        <span className="stat-title">{t("ct.stats.scheduled") || "Scheduled"}</span>
                    </div>
                    <div className="ct-stat-card active">
                        <span className="stat-icon">⚙️</span>
                        <span className="stat-value">{stats.inProgress}</span>
                        <span className="stat-title">{t("ct.stats.inProgress") || "In Progress"}</span>
                    </div>
                    <div className="ct-stat-card success">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-title">{t("ct.stats.completed") || "Completed"}</span>
                    </div>
                </div>

                <div className="ct-action-box">
                    <ComplementaryTaskSearch onSearch={handleSearch} />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="create-ct-button"
                    >
                        {t("ct.createButton") || "New Task"}
                    </button>
                </div>
            </div>

            {isLoading && <p>{t("common.loading")}</p>}
            {error && <p className="error-message">{error.message}</p>}

            <ComplementaryTaskTable
                tasks={tasks}
                categories={categories}
                onEdit={handleEdit}
                onViewCategory={handleViewCategory}
                onFixCategory={handleFixCategory}
            />

            <ComplementaryTaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    loadData();
                    setIsCreateModalOpen(false);
                }}
            />

            {selectedTask && (
                <ComplementaryTaskEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdated={handleCloseEditModal}
                    resource={selectedTask}
                />
            )}

            <ComplementaryTaskCategoryDetailsModal
                isOpen={isCategoryDetailsOpen}
                onClose={() => setIsCategoryDetailsOpen(false)}
                category={viewCategory}
            />

            <ComplementaryTaskFixCategoryModal
                isOpen={isFixModalOpen}
                task={taskToFix}
                onClose={() => setIsFixModalOpen(false)}
                onFixed={() => {
                    loadData();
                    setIsFixModalOpen(false);
                    setTaskToFix(null);
                }}
            />
        </div>
    );
}

export default ComplementaryTaskPage;