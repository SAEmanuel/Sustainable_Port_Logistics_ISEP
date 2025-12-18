import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { updateCT } from "../services/complementaryTaskService";
import { getAllCTC } from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";
import type { ComplementaryTask } from "../domain/complementaryTask";
import type { HandleComplementaryTaskDTO } from "../dtos/handleComplementaryTaskDTO";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";
import "../style/complementaryTask.css";

const MOCK_VVE_LIST = [
    { id: "VVE-001", name: "VVE-2024-Arrival-01" },
    { id: "VVE-002", name: "VVE-2024-Departure-02" },
    { id: "VVE-003", name: "VVE-2024-Maintenance-03" }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    resource: ComplementaryTask;
}

type FormState = Omit<HandleComplementaryTaskDTO, "timeStart" | "timeEnd"> & {
    timeStart: string;
    timeEnd: string;
};

const toInputDateString = (dateInput: Date | string) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
};

function ComplementaryTaskEditModal({ isOpen, onClose, onUpdated, resource }: Props) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);

    const [formData, setFormData] = useState<FormState>({
        category: resource.category,
        staff: resource.staff,
        vve: resource.vve,
        status: resource.status,
        timeStart: toInputDateString(resource.timeStart),
        timeEnd: toInputDateString(resource.timeEnd)
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            setFormData({
                category: resource.category,
                staff: resource.staff,
                vve: resource.vve,
                status: resource.status,
                timeStart: toInputDateString(resource.timeStart),
                timeEnd: toInputDateString(resource.timeEnd)
            });
            setError(null);
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
        setError(null);
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        setIsLoading(true);
        try {
            const submitData: HandleComplementaryTaskDTO = {
                ...formData,
                timeStart: new Date(formData.timeStart),
                timeEnd: new Date(formData.timeEnd)
            };

            await updateCT(resource.code, submitData);
            toast.success(t("ct.success.updated") || "Task updated");
            onUpdated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
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
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.code}>
                                        {cat.name}
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
                            >
                                {MOCK_VVE_LIST.map(vve => (
                                    <option key={vve.id} value={vve.id}>
                                        {vve.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="ct-form-group">
                        <label>{t("ct.form.staff")}</label>
                        <input
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
                            <label>{t("ct.form.endTime")}</label>
                            <input
                                required
                                name="timeEnd"
                                type="datetime-local"
                                value={formData.timeEnd}
                                onChange={handleValueChange}
                            />
                        </div>
                    </div>

                    <div className="ct-form-group">
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

                    {error && <p className="ct-error-message">{error.message}</p>}

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