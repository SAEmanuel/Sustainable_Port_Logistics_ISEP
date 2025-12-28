import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createCTC } from "../services/complementaryTaskCategoryService";
import type { Category } from "../domain/complementaryTaskCategory";
import type { CreateComplementaryTaskCategoryDTO } from "../dtos/createComplementaryTaskCategoryDTO";
import "../style/complementaryTaskCategory.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const initialData: Partial<CreateComplementaryTaskCategoryDTO> = {
    code: "",
    name: "",
    description: "",
    category: "Maintenance" as Category,
    defaultDuration: undefined
};

const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case "Safety and Security": return "🛡️";
        case "Maintenance": return "🔧";
        case "Cleaning and Housekeeping": return "🧹";
        default: return "📋";
    }
};

function ComplementaryTaskCategoryCreateModal({ isOpen, onClose, onCreated }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<CreateComplementaryTaskCategoryDTO>>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFormData(initialData);
            setError(null);
        }
    }, [isOpen]);

    const handleCategorySelect = (cat: Category) => {
        setFormData(prev => ({ ...prev, category: cat }));
        setStep(2);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (!formData.code || formData.code.trim() === "") {
            const msg = t("ctc.errors.codeRequired") || "Code is required.";
            setError(new Error(msg));
            toast.error(msg);
            return;
        }

        if (!formData.name || formData.name.trim() === "") {
            const msg = t("ctc.errors.nameRequired");
            setError(new Error(msg));
            toast.error(msg);
            return;
        }

        if (formData.defaultDuration !== undefined && (formData.defaultDuration < 0 || isNaN(formData.defaultDuration))) {
            const msg = t("ctc.errors.invalidDuration");
            setError(new Error(msg || "Duration must be a positive number."));
            toast.error(msg || "Duration must be a positive number.");
            return;
        }

        setIsLoading(true);
        try {
            const dtoToSend: CreateComplementaryTaskCategoryDTO = {
                code: formData.code!,
                name: formData.name!,
                description: formData.description || "",
                category: formData.category!,
                defaultDuration: formData.defaultDuration ?? null
            } as CreateComplementaryTaskCategoryDTO;

            await createCTC(dtoToSend);
            toast.success(t("ctc.success.created"));
            onCreated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
            toast.error(apiError.message || t("ctc.errors.createFailedGeneric") || "Creation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ctc-modal-overlay">
            <div className="ctc-modal-content">
                <div className="ctc-wizard-progress">
                    <div className={`ctc-wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'complete' : ''}`}>
                        <div className="step-dot">1</div>
                        <span>{t("ctc.steps.category")}</span>
                    </div>
                    <div className={`ctc-wizard-step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-dot">2</div>
                        <span>{t("ctc.steps.details")}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div>
                            <h3>{t("ctc.selectCategory")}</h3>
                            <div className="ctc-type-selection-grid">
                                {["Safety and Security", "Maintenance", "Cleaning and Housekeeping"].map((cat) => (
                                    <div key={cat} className="ctc-type-card" onClick={() => handleCategorySelect(cat as Category)}>
                                        <div className="type-card-icon">{getCategoryIcon(cat)}</div>
                                        <div>{t(`ctc.categories.${cat}`)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="ctc-modal-actions-wizard">
                                <button type="button" onClick={onClose} className="ctc-cancel-button">
                                    {t("actions.cancel")}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="ctc-form-group">
                                <label htmlFor="ctc-create-code">{t("ctc.form.code")}</label>
                                <input
                                    id="ctc-create-code"
                                    required
                                    name="code"
                                    type="text"
                                    value={formData.code || ""}
                                    onChange={handleValueChange}
                                />
                            </div>
                            <div className="ctc-form-group">
                                <label htmlFor="ctc-create-name">{t("ctc.form.name")}</label>
                                <input
                                    id="ctc-create-name"
                                    required
                                    name="name"
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={handleValueChange}
                                />
                            </div>
                            <div className="ctc-form-group">
                                <label htmlFor="ctc-create-description">{t("ctc.form.description")}</label>
                                <input
                                    id="ctc-create-description"
                                    name="description"
                                    type="text"
                                    value={formData.description || ""}
                                    onChange={handleValueChange}
                                />
                            </div>
                            <div className="ctc-form-group">
                                <label htmlFor="ctc-create-duration">{t("ctc.form.duration")} ({t("physicalResource.form.opcional")})</label>
                                <input
                                    id="ctc-create-duration"
                                    type="number"
                                    name="defaultDuration"
                                    min="0"
                                    step="1"
                                    value={formData.defaultDuration || ""}
                                    onChange={handleValueChange}
                                />
                            </div>

                            {error && <p className="pr-error-message">{error.message}</p>}

                            <div className="ctc-modal-actions-wizard">
                                <button type="button" onClick={() => setStep(1)} className="ctc-cancel-button">
                                    {t("ctc.actions.back")}
                                </button>
                                <button type="submit" disabled={isLoading} className="ctc-submit-button">
                                    {isLoading ? t("common.saving") : t("ctc.actions.create")}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ComplementaryTaskCategoryCreateModal;