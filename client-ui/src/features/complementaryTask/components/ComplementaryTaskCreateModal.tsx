import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createCT } from "../services/complementaryTaskService";
import { getAllCTC } from "../../complementaryTaskCategory/services/complementaryTaskCategoryService";
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
    onCreated: () => void;
}

type FormState = Omit<HandleComplementaryTaskDTO, "timeStart" | "timeEnd"> & {
    timeStart: string;
    timeEnd: string;
};

const initialData: FormState = {
    category: "",
    staff: "",
    vve: "",
    status: "Scheduled",
    timeStart: "",
    timeEnd: ""
};

function ComplementaryTaskCreateModal({ isOpen, onClose, onCreated }: Props) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<FormState>(initialData);
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
            setError(null);
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        try {
            const data = await getAllCTC();
            setCategories(data.filter(c => c.isActive));
        } catch {
            toast.error("Failed to load categories");
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

        if (!formData.category) {
            toast.error(t("ct.errors.categoryRequired") || "Category is required");
            return;
        }
        if (!formData.vve) {
            toast.error(t("ct.errors.vveRequired") || "VVE is required");
            return;
        }

        setIsLoading(true);
        try {
            const submitData: HandleComplementaryTaskDTO = {
                ...formData,
                timeStart: new Date(formData.timeStart),
                timeEnd: new Date(formData.timeEnd)
            };

            await createCT(submitData);
            toast.success(t("ct.success.created") || "Task created successfully");
            onCreated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
            toast.error(apiError.message || "Creation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ct-modal-overlay">
            <div className="ct-modal-content">
                <h2>{t("ct.createTitle") || "Create Complementary Task"}</h2>

                <form onSubmit={handleSubmit} className="ct-form">

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.category")}</label>
                            <select
                                required
                                name="category"
                                value={formData.category}
                                onChange={handleValueChange}
                            >
                                <option value="">{t("common.select")}</option>
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
                                required
                                name="vve"
                                value={formData.vve}
                                onChange={handleValueChange}
                            >
                                <option value="">{t("common.select")}</option>
                                {MOCK_VVE_LIST.map(vve => (
                                    <option key={vve.id} value={vve.id}>
                                        {vve.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="ct-form-group" style={{ flex: 1 }}>
                            <label>{t("ct.form.staff")}</label>
                            <input
                                name="staff"
                                type="text"
                                value={formData.staff}
                                onChange={handleValueChange}
                                placeholder="Staff ID or Name"
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
                            </select>
                        </div>
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

                    {error && <p className="ct-error-message">{error.message}</p>}

                    <div className="ct-modal-actions-wizard">
                        <button type="button" onClick={onClose} className="ct-cancel-button">
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" disabled={isLoading} className="ct-submit-button">
                            {isLoading ? t("common.saving") : t("ct.actions.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ComplementaryTaskCreateModal;