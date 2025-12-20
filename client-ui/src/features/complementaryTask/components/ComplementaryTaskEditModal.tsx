import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { updateCT } from "../services/complementaryTaskService";
import { getAllCTC } from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";
import type { ComplementaryTask, CTStatus } from "../domain/complementaryTask";
import type { UpdateComplementaryTaskDTO } from "../dtos/updateComplementaryTaskDTO";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";
import type { VesselVisitExecutionDTO } from "../../vesselVisitExecution/dto/vesselVisitExecutionDTO";
import "../style/complementaryTask.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    resource: ComplementaryTask;
    vveList: VesselVisitExecutionDTO[];
}

const toInputDateString = (dateInput: Date | string) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function ComplementaryTaskEditModal({ isOpen, onClose, onUpdated, resource, vveList }: Props) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        category: resource.category, // Aqui deve ser guardado o ID
        staff: resource.staff,
        vve: resource.vve,
        status: resource.status,
        timeStart: toInputDateString(resource.timeStart)
    });

    useEffect(() => {
        if (isOpen) {
            void loadCategories();
            setFormData({
                category: resource.category,
                staff: resource.staff,
                vve: resource.vve,
                status: resource.status,
                timeStart: toInputDateString(resource.timeStart)
            });
        }
    }, [isOpen, resource]);

    const loadCategories = async () => {
        try {
            const data = await getAllCTC();
            setCategories(data);
        } catch (err) {
            console.error("Failed categories", err);
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log(formData.vve);
        try {
            const submitData: UpdateComplementaryTaskDTO = {
                category: formData.category,
                staff: formData.staff,
                vve: formData.vve,
                status: formData.status as CTStatus,
                timeStart: new Date(formData.timeStart)
            };

            await updateCT(resource.code, submitData);
            toast.success(t("ct.success.updated") || "Task updated");
            onUpdated();
        } catch (err) {
            const apiError = err as Error;
            toast.error(apiError.message || t("ct.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ct-modal-overlay">
            <div className="ct-modal-content">
                <h2>{t("ct.editTitle") || "Edit Task"} - {resource.code}</h2>
                <form onSubmit={handleSubmit} className="ct-form">

                    <div className="ct-form-group">
                        <label>{t("ct.form.code")} ({t("ct.read-only")})</label>
                        <input type="text" value={resource.code} disabled className="info-card-input" />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.category")}</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleValueChange}
                                required
                            >
                                <option value="" disabled>{t("common.select") || "Select Category"}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} ({cat.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.vve")}</label>
                            <select
                                name="vve"
                                value={formData.vve}
                                onChange={handleValueChange}
                                required
                            >
                                {vveList.map(vve => (
                                    <option key={vve.id} value={vve.id}>
                                        {vve.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="ct-form-group">
                        <label>{t("ct.form.staff")}</label>
                        <input
                            required
                            name="staff"
                            type="text"
                            value={formData.staff}
                            onChange={handleValueChange}
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.startTime")}</label>
                            <input
                                required
                                name="timeStart"
                                type="datetime-local"
                                value={formData.timeStart}
                                onChange={handleValueChange}
                            />
                        </div>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.status")}</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleValueChange}
                            >
                                <option value="Scheduled">{t("ct.status.Scheduled")}</option>
                                <option value="InProgress">{t("ct.status.InProgress")}</option>
                                <option value="Completed">{t("ct.status.Completed")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="ct-modal-actions-wizard">
                        <button type="button" onClick={onClose} className="ct-cancel-button">
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" className="ct-submit-button" disabled={isLoading}>
                            {isLoading ? t("common.saving") : t("actions.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ComplementaryTaskEditModal;