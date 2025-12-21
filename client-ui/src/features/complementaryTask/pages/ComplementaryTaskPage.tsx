import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { BookAIcon } from "lucide-react";
import "../style/complementaryTask.css";

import {
    getAllCT,
    getCTByCode,
    getCTByStaff,
    getCTByVve,
    getScheduledCT,
    getCompletedCT,
    getInProgressCT,
    getCTInRange,
    updateCT, getCTByCategoryCode
} from "../services/complementaryTaskService";

import {
    getCTCById,
    getAllCTC
} from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";

import {
    getAllVVE,
    getVVEById
} from "../../vesselVisitExecution/services/vesselVisitExecutionService";

import {
    getVvnById
} from "../../vesselVisitNotification/service/vvnService";

import type { ComplementaryTask } from "../domain/complementaryTask";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";
import type { VesselVisitExecutionDTO } from "../../vesselVisitExecution/dto/vesselVisitExecutionDTO";
import type { UpdateComplementaryTaskDTO } from "../dtos/updateComplementaryTaskDTO";
import type { VesselVisitNotificationDto } from "../../vesselVisitNotification/dto/vvnTypesDtos";

import ComplementaryTaskTable from "../components/ComplementaryTaskTable";
import ComplementaryTaskSearch from "../components/ComplementaryTaskSearch";
import ComplementaryTaskCreateModal from "../components/ComplementaryTaskCreateModal";
import ComplementaryTaskEditModal from "../components/ComplementaryTaskEditModal";
import ComplementaryTaskCategoryDetailsModal from "../../complementaryTaskCategory/components/ComplementaryTaskCategoryDetailsModal";
import ComplementaryTaskFixCategoryModal from "../components/ComplementaryTaskFixCategoryModal";
import VesselVisitExecutionDetailsModal from "../../vesselVisitExecution/components/vesselVisitExecutionDetailsModal";
import VvnDetailsModal from "../../vesselVisitNotification/components/modals/VvnDetailsModal";

export type FilterType = "all" | "code" | "category" | "staff" | "vve" | "scheduled" | "completed" | "inProgress" | "range";

function ComplementaryTaskPage() {
    const { t } = useTranslation();
    const didMountRef = useRef(false);

    const [tasks, setTasks] = useState<ComplementaryTask[]>([]);
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [vves, setVves] = useState<VesselVisitExecutionDTO[]>([]);


    const [selectedTask, setSelectedTask] = useState<ComplementaryTask | null>(null);
    const [viewCategory, setViewCategory] = useState<ComplementaryTaskCategory | null>(null);
    const [viewVve, setViewVve] = useState<VesselVisitExecutionDTO | null>(null);
    const [viewVvn, setViewVvn] = useState<VesselVisitNotificationDto | null>(null);
    const [taskToFix, setTaskToFix] = useState<ComplementaryTask | null>(null);


    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCategoryDetailsOpen, setIsCategoryDetailsOpen] = useState(false);
    const [isVveDetailsOpen, setIsVveDetailsOpen] = useState(false);
    const [isVvnDetailsOpen, setIsVvnDetailsOpen] = useState(false);
    const [isFixModalOpen, setIsFixModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            void loadData();
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [tasksData, catsData, vvesData] = await Promise.all([
                getAllCT(),
                getAllCTC(),
                getAllVVE()
            ]);

            setTasks(tasksData);
            setCategories(catsData);
            setVves(vvesData as unknown as VesselVisitExecutionDTO[]);
        } catch {
            toast.error(t("ct.errors.loadAll") || "Error loading data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: FilterType, value: unknown) => {
        setIsLoading(true);
        try {
            let data: ComplementaryTask[] = [];
            switch (type) {
                case "code":
                    data = await getCTByCode(value as string).then(res => res ? [res] : []);
                    break;
                case "category": data = await getCTByCategoryCode(value as string); break;
                case "staff": data = await getCTByStaff(value as string); break;
                case "vve": data = await getCTByVve(value as string); break;
                case "scheduled": data = await getScheduledCT(); break;
                case "completed": data = await getCompletedCT(); break;
                case "inProgress": data = await getInProgressCT(); break;
                case "range": {
                    const range = value as { start: number; end: number };
                    data = await getCTInRange(range.start, range.end);
                    break;
                }
                case "all":
                default:
                    await loadData();
                    return;
            }
            setTasks(data);
        } catch {
            setTasks([]);
            toast.error(t("ct.errors.search") || "Search failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (code: string, newStatus: string) => {
        setIsLoading(true);
        try {
            const task = tasks.find(t => t.code === code);
            if (!task) throw new Error("Task not found");

            const updateDto: UpdateComplementaryTaskDTO = {
                category: task.category,
                staff: task.staff,
                status: newStatus as "Scheduled" | "InProgress" | "Completed",
                timeStart: task.timeStart,
                vve: task.vve
            };

            await updateCT(code, updateDto);
            toast.success(t("ct.success.statusUpdated") || "Status updated successfully");
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage || t("ct.errors.statusUpdateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewVve = async (vveId: string) => {
        if (!vveId) return;
        setIsLoading(true);
        try {
            const vveData = await getVVEById(vveId);
            setViewVve(vveData as unknown as VesselVisitExecutionDTO);
            setIsVveDetailsOpen(true);
        } catch {
            toast.error("Failed to load VVE details");
        } finally {
            setIsLoading(false);
        }
    };


    const handleViewVvn = async (vvnId: string) => {
        if (!vvnId) return;
        setIsLoading(true);
        try {
            console.log(vvnId);
            const vvnData = await getVvnById(vvnId);
            const data = Array.isArray(vvnData) ? vvnData[0] : vvnData;
            setViewVvn(data);
            setIsVvnDetailsOpen(true);
        } catch {
            toast.error(t("vvn.errors.loadDetails") || "Failed to load VVN details");
        } finally {
            setIsLoading(false);
        }
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

    const stats = useMemo(() => {
        return {
            total: tasks.length,
            scheduled: tasks.filter(t => t.status === "Scheduled").length,
            inProgress: tasks.filter(t => t.status === "InProgress").length,
            completed: tasks.filter(t => t.status === "Completed").length
        };
    }, [tasks]);

    return (
        <div className="ct-page-container">
            <div className="ct-header">
                <Link to="/dashboard" className="ct-back-button" title={t("actions.backToDashboard")}>‹</Link>
                <h1><BookAIcon className="ct-icon" /> {t("ct.title") || "Complementary Tasks"}</h1>
            </div>

            <div className="ct-controls-container">
                <div className="ct-stats-grid">
                    <div className="ct-stat-card total" onClick={() => void handleSearch("all", "")} style={{cursor: 'pointer'}}>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-title">{t("ct.stats.total")}</span>
                    </div>
                    <div className="ct-stat-card warning" onClick={() => void handleSearch("scheduled", "")} style={{cursor: 'pointer'}}>
                        <span className="stat-value">{stats.scheduled}</span>
                        <span className="stat-title">{t("ct.stats.scheduled")}</span>
                    </div>
                    <div className="ct-stat-card active" onClick={() => void handleSearch("inProgress", "")} style={{cursor: 'pointer'}}>
                        <span className="stat-value">{stats.inProgress}</span>
                        <span className="stat-title">{t("ct.stats.inProgress")}</span>
                    </div>
                    <div className="ct-stat-card success" onClick={() => void handleSearch("completed", "")} style={{cursor: 'pointer'}}>
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-title">{t("ct.stats.completed")}</span>
                    </div>
                </div>

                <div className="ct-action-box">
                    <ComplementaryTaskSearch onSearch={handleSearch} />
                    <button onClick={() => setIsCreateModalOpen(true)} className="create-ct-button">
                        {t("ct.createButton") || "New Task"}
                    </button>
                </div>
            </div>

            {isLoading && <p className="loading-overlay">{t("common.loading")}</p>}

            <ComplementaryTaskTable
                tasks={tasks}
                categories={categories}
                vves={vves}
                onEdit={(task) => { setSelectedTask(task); setIsEditModalOpen(true); }}
                onViewCategory={handleViewCategory}
                onViewVve={handleViewVve}
                onFixCategory={(task) => { setTaskToFix(task); setIsFixModalOpen(true); }}
                onStatusChange={handleStatusChange}
            />

            {/* MODAIS DE DETALHES */}
            <VesselVisitExecutionDetailsModal
                isOpen={isVveDetailsOpen}
                onClose={() => setIsVveDetailsOpen(false)}
                vve={viewVve}
                onViewVvn={handleViewVvn}
            />

            <VvnDetailsModal
                isOpen={isVvnDetailsOpen}
                onClose={() => setIsVvnDetailsOpen(false)}
                vvn={viewVvn}
            />

            <ComplementaryTaskCategoryDetailsModal
                isOpen={isCategoryDetailsOpen}
                onClose={() => setIsCategoryDetailsOpen(false)}
                category={viewCategory}
            />

            {/* MODAIS DE OPERAÇÃO */}
            <ComplementaryTaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={loadData}
                vveList={vves}
            />

            {selectedTask && (
                <ComplementaryTaskEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); void loadData(); }}
                    onUpdated={() => { setIsEditModalOpen(false); setSelectedTask(null); void loadData(); }}
                    resource={selectedTask}
                    vveList={vves}
                />
            )}

            <ComplementaryTaskFixCategoryModal
                isOpen={isFixModalOpen}
                task={taskToFix}
                onClose={() => setIsFixModalOpen(false)}
                onFixed={() => { void loadData(); setIsFixModalOpen(false); setTaskToFix(null); }}
            />
        </div>
    );
}

export default ComplementaryTaskPage;