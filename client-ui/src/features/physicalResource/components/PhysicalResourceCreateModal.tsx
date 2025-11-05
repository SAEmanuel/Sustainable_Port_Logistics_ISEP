import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createPhysicalResource } from "../services/physicalResourceService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/types/qualification";

import { PhysicalResourceType } from "../types/physicalResource";
import type { CreatePhysicalResource } from "../types/physicalResource";
import "../style/physicalResource.css";

const getResourceIcon = (type: PhysicalResourceType | string) => {
    switch (type) {
        case PhysicalResourceType.STSCrane: return "🏗️";
        case PhysicalResourceType.YGCrane: return "🚧";
        case PhysicalResourceType.MCrane: return "🚛";
        case PhysicalResourceType.Truck: return "🚚";
        case PhysicalResourceType.Forklift: return "🛺";
        case PhysicalResourceType.RStacker: return "🚜";
        case PhysicalResourceType.SCarrier: return "📦";
        case PhysicalResourceType.TugBoat: return "🚤";
        default: return "⚙️";
    }
};

interface PhysicalResourceCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const initialState: CreatePhysicalResource = {
    description: "",
    operationalCapacity: undefined,
    setupTime: undefined,
    physicalResourceType: undefined,
    qualificationCode: undefined,
};

function PhysicalResourceCreateModal({ isOpen, onClose, onCreated }: PhysicalResourceCreateModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<CreatePhysicalResource>(initialState);
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimatingOut(false);
            const fetchQualifications = async () => {
                try {
                    const data = await getQualifications();
                    setQualifications(data);
                } catch (err) {
                    toast.error(t("errors.loadQualifications"));
                }
            };
            fetchQualifications();
        } else {
            setFormData(initialState);
            setError(null);
            setStep(1);
        }
    }, [isOpen, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        const isNumericField = name === "operationalCapacity" || name === "setupTime";
        const finalValue = isNumericField ? (value === "" ? undefined : Number(value)) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleTypeSelect = (type: PhysicalResourceType) => {
        setFormData(prev => ({ ...prev, physicalResourceType: type }));
        setStep(2);
    };

    const handleNext = () => {
        if (step === 2 && !formData.description) {
            setError(new Error(t("physicalResource.errors.descriptionRequired")));
            toast.error(t("physicalResource.errors.descriptionRequired"));
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(step - 1);
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await createPhysicalResource(formData);
            toast.success(t("physicalResource.success.created"));
            onCreated();
        } catch (err) {
            const error = err as Error;
            setError(error);
            toast.error(error.message || t("physicalResource.errors.createFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen && !isAnimatingOut) {
        return null;
    }

    return (
        <div className={`pr-modal-overlay ${isAnimatingOut ? 'anim-out' : ''}`}>
            <div className={`pr-modal-content ${isAnimatingOut ? 'anim-out' : ''}`}>

                {}
                <div className="pr-wizard-progress">
                    <div className={`pr-wizard-step ${step === 1 ? 'active' : (step > 1 ? 'complete' : '')}`}>
                        <div className="step-dot">1</div>
                        <div className="step-label">{t("physicalResource.steps.type")}</div>
                    </div>
                    <div className="step-connector"></div>
                    <div className={`pr-wizard-step ${step === 2 ? 'active' : (step > 2 ? 'complete' : '')}`}>
                        <div className="step-dot">2</div>
                        <div className="step-label">{t("physicalResource.steps.details")}</div>
                    </div>
                    <div className="step-connector"></div>
                    <div className={`pr-wizard-step ${step === 3 ? 'active' : ''}`}>
                        <div className="step-dot">3</div>
                        <div className="step-label">{t("physicalResource.steps.assignment")}</div>
                    </div>
                </div>

                {}
                <form onSubmit={handleSubmit} className="pr-form">

                    {}
                    {step === 1 && (
                        <div className="pr-wizard-step-content">
                            <h3 className="pr-wizard-prompt">{t("physicalResource.steps.selectTypePrompt")}</h3>
                            <div className="pr-type-selection-grid">
                                {Object.values(PhysicalResourceType).map((typeValue) => (
                                    <button
                                        type="button"
                                        key={typeValue}
                                        className="pr-type-card"
                                        onClick={() => handleTypeSelect(typeValue)}
                                    >
                                        <div className="type-card-icon">{getResourceIcon(typeValue)}</div>
                                        <div className="type-card-label">{t(`physicalResource.types.${typeValue}`)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {step === 2 && (
                        <div className="pr-wizard-step-content">
                            <div className="pr-form-group">
                                <label htmlFor="description">{t("physicalResource.form.description")}</label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder={t("physicalResource.form.descriptionPlaceholder")}
                                    required
                                />
                            </div>
                            <div className="pr-form-group">
                                <label htmlFor="operationalCapacity">{t("physicalResource.form.operationalCapacity")}</label>
                                <input
                                    type="number"
                                    id="operationalCapacity"
                                    name="operationalCapacity"
                                    value={formData.operationalCapacity ?? ""}
                                    onChange={handleChange}
                                    placeholder={t("physicalResource.form.capacityPlaceholder")}
                                    min="0"
                                />
                            </div>
                            <div className="pr-form-group">
                                <label htmlFor="setupTime">{t("physicalResource.form.setupTime")}</label>
                                <input
                                    type="number"
                                    id="setupTime"
                                    name="setupTime"
                                    value={formData.setupTime ?? ""}
                                    onChange={handleChange}
                                    placeholder={t("physicalResource.form.setupTimePlaceholder")}
                                    min="0"
                                />
                            </div>
                        </div>
                    )}

                    {}
                    {step === 3 && (
                        <div className="pr-wizard-step-content">
                            <div className="pr-form-group">
                                <label htmlFor="qualificationCode">{t("physicalResource.form.qualification")} ({t("physicalResource.form.opcional")})</label>
                                <select
                                    id="qualificationCode"
                                    name="qualificationCode"
                                    value={formData.qualificationCode ?? ""}
                                    onChange={handleChange}
                                >
                                    <option value="">{t("physicalResource.form.selectOptionNone")}</option>
                                    {qualifications.map((q) => (
                                        <option key={q.id} value={q.code}>
                                            {q.name} ({q.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {error && <p className="pr-error-message">{error.message}</p>}

                    {}
                    <div className="pr-modal-actions-wizard">
                        {step === 1 && (
                            <button type="button" onClick={handleClose} className="pr-cancel-button">
                                {t("physicalResource.actions.cancel")}
                            </button>
                        )}
                        {step > 1 && (
                            <button type="button" onClick={handleBack} className="pr-cancel-button">
                                {t("physicalResource.actions.back")}
                            </button>
                        )}
                        {step < 3 && (
                            <button type="button" onClick={handleNext} className="pr-submit-button">
                                {t("physicalResource.actions.next")}
                            </button>
                        )}
                        {step === 3 && (
                            <button type="submit" className="pr-submit-button" disabled={isLoading}>
                                {isLoading ? t("physicalResource.actions.creating") : t("physicalResource.actions.create")}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PhysicalResourceCreateModal;