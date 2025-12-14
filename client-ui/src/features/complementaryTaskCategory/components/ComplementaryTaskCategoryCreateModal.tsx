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

const initialData = {
    name: "",
    description: "",
    category: "Maintenance" as Category, // Valor padrão temporário
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

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFormData(initialData);
        }
    }, [isOpen]);

    const handleCategorySelect = (cat: Category) => {
        setFormData(prev => ({ ...prev, category: cat }));
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createCTC(formData as CreateComplementaryTaskCategoryDTO);
            toast.success(t("ctc.success.created"));
            onCreated();
        } catch (err) {
            toast.error(t("ctc.errors.create"));
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
                                <label>{t("ctc.form.name")}</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="ctc-form-group">
                                <label>{t("ctc.form.description")}</label>
                                <input
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="ctc-form-group">
                                <label>{t("ctc.form.duration")}</label>
                                <input
                                    type="number"
                                    value={formData.defaultDuration || ""}
                                    onChange={e => setFormData({...formData, defaultDuration: Number(e.target.value)})}
                                />
                            </div>

                            <div className="ctc-modal-actions-wizard">
                                <button type="button" onClick={() => setStep(1)} className="ctc-cancel-button">
                                    {t("actions.back")}
                                </button>
                                <button type="submit" disabled={isLoading} className="ctc-submit-button">
                                    {isLoading ? t("common.saving") : t("actions.create")}
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