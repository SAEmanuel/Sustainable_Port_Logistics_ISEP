import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { updateCT } from "../services/complementaryTaskService";
import { getAllCTC } from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";
import type { ComplementaryTask } from "../domain/complementaryTask";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";
import type { HandleComplementaryTaskDTO } from "../dtos/handleComplementaryTaskDTO";
import { FaExclamationTriangle } from "react-icons/fa";
import "../style/complementaryTask.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onFixed: () => void;
    task: ComplementaryTask | null;
}

function ComplementaryTaskFixCategoryModal({ isOpen, onClose, onFixed, task }: Props) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadActiveCategories();
            setNewCategory("");
        }
    }, [isOpen]);

    const loadActiveCategories = async () => {
        try {
            const data = await getAllCTC();
            setCategories(data.filter(c => c.isActive));
        } catch {
            toast.error("Failed to load categories");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        if (!newCategory) {
            toast.error(t("ct.errors.categoryRequired") || "Please select a valid category");
            return;
        }

        setIsLoading(true);
        try {
            const dto: HandleComplementaryTaskDTO = {
                category: newCategory,
                staff: task.staff,
                vve: task.vve,
                status: task.status,
                timeStart: task.timeStart,
                timeEnd: task.timeEnd
            };

            await updateCT(task.code, dto);
            toast.success(t("ct.success.updated") || "Category fixed successfully");
            onFixed();
        } catch {
            toast.error("Failed to update category");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="ct-modal-overlay">
            <div className="ct-modal-content warning-modal">
                <div className="ct-warning-header">
                    <FaExclamationTriangle className="warning-icon-large" />
                    <h2>{t("ct.fixCategoryTitle") || "Action Required"}</h2>
                </div>

                <p className="ct-warning-text">
                    {t("ct.fixCategoryMessage") ||
                        `The category "${task.category}" is currently inactive. You must assign a new active category to this task.`}
                </p>

                <form onSubmit={handleSubmit} className="ct-form">
                    <div className="ct-form-group">
                        <label>{t("ct.form.newCategory") || "Select New Category"}</label>
                        <select
                            required
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="ct-input-warning"
                        >
                            <option value="">{t("common.select")}</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.code}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ct-modal-actions-wizard">
                        <button type="button" onClick={onClose} className="ct-cancel-button">
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" disabled={isLoading} className="ct-submit-button warning-button">
                            {isLoading ? t("common.saving") : t("ct.actions.fix") || "Update Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ComplementaryTaskFixCategoryModal;