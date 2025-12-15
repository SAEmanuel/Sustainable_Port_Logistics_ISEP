import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { updateCTC } from "../services/complementaryTaskCategoryService";
import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";
import type { UpdateComplementaryTaskCategoryDTO } from "../dtos/updateComplementaryTaskCategoryDTO";
import "../style/complementaryTaskCategory.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    resource: ComplementaryTaskCategory;
}

function ComplementaryTaskCategoryEditModal({ isOpen, onClose, onUpdated, resource }: Props) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UpdateComplementaryTaskCategoryDTO>({
        name: resource.name,
        description: resource.description,
        category: resource.category,
        defaultDuration: resource.defaultDuration ?? undefined,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Sincroniza o estado inicial do formulário com o recurso atual
            setFormData({
                name: resource.name,
                description: resource.description,
                category: resource.category,
                defaultDuration: resource.defaultDuration ?? undefined,
            });
            setError(null);
        }
    }, [isOpen, resource]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        const { name, value } = e.target;

        const isNumericField = name === "defaultDuration";
        const finalValue = isNumericField ? (value === "" ? undefined : Number(value)) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validações básicas (consistentes com o modal de criação)
        if (!formData.name || formData.name.trim() === "") {
            const msg = t("ctc.errors.nameRequired");
            setError(new Error(msg));
            toast.error(msg);
            return;
        }
        if (formData.defaultDuration !== undefined && (formData.defaultDuration < 0 || isNaN(formData.defaultDuration))) {
            const msg = t("ctc.errors.invalidDuration") || "Duration must be a positive number.";
            setError(new Error(msg));
            toast.error(msg);
            return;
        }

        setIsLoading(true);
        try {
            await updateCTC(resource.code, formData);
            toast.success(t("ctc.success.updated"));
            onUpdated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
            toast.error(apiError.message || t("ctc.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ctc-modal-overlay">
            <div className="ctc-modal-content">
                <h2>{t("ctc.editModal.title")} - {resource.code}</h2>
                <form onSubmit={handleSubmit} className="ctc-form">

                    <div className="ctc-form-group">
                        <label htmlFor="code">{t("ctc.form.code")} ({t("ctc.read-only")})</label>
                        <input id="code" type="text" value={resource.code} disabled className="info-card-input" />
                    </div>

                    <div className="ctc-form-group">
                        <label htmlFor="name">{t("ctc.form.name")}</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleValueChange}
                        />
                    </div>

                    <div className="ctc-form-group">
                        <label htmlFor="description">{t("ctc.form.description")}</label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            value={formData.description}
                            onChange={handleValueChange}
                        />
                    </div>

                    <div className="ctc-form-group">
                        <label htmlFor="category">{t("ctc.steps.category")}</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleValueChange}
                        >
                            {["Safety and Security", "Maintenance", "Cleaning and Housekeeping"].map((cat) => (
                                <option key={cat} value={cat}>
                                    {t(`ctc.categories.${cat}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ctc-form-group">
                        <label htmlFor="defaultDuration">{t("ctc.form.duration")} ({t("physicalResource.form.opcional")})</label>
                        <input
                            id="defaultDuration"
                            name="defaultDuration"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.defaultDuration ?? ""}
                            onChange={handleValueChange}
                        />
                    </div>

                    {error && <p className="ctc-error-message">{error.message}</p>}

                    <div className="ctc-modal-actions-wizard">
                        <button type="button" onClick={onClose} className="ctc-cancel-button">
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" className="ctc-submit-button" disabled={isLoading}>
                            {isLoading ? t("common.saving") : t("actions.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ComplementaryTaskCategoryEditModal;