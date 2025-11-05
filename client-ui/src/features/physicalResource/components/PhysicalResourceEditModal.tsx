import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { updatePhysicalResource } from "../services/physicalResourceService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/types/qualification";
import type { PhysicalResource, UpdatePhysicalResource } from "../types/physicalResource";
import { PhysicalResourceType } from "../types/physicalResource";
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

interface PhysicalResourceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: (updatedResource: PhysicalResource) => void;
    resource: PhysicalResource;
}

function PhysicalResourceEditModal({ isOpen, onClose, onUpdated, resource }: PhysicalResourceEditModalProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UpdatePhysicalResource>({});
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen && resource) {
            setIsAnimatingOut(false);
            setFormData({
                description: resource.description,
                operationalCapacity: resource.operationalCapacity,
                setupTime: resource.setupTime,
                qualificationId: resource.qualificationID || undefined,
            });
            setError(null);

            const fetchQualifications = async () => {
                try {
                    const data = await getQualifications();
                    setQualifications(data);
                } catch (err) {
                    toast.error(t("physicalResource.errors.loadQualifications"));
                }
            };
            fetchQualifications();
        }
    }, [isOpen, resource, t]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        const isNumericField = name === "operationalCapacity" || name === "setupTime";
        const finalValue = isNumericField ? (value === "" ? undefined : Number(value)) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!formData.description) {
                throw new Error(t("physicalResource.errors.descriptionRequired"));
            }

            const dto: UpdatePhysicalResource = {
                description: formData.description,
                operationalCapacity: formData.operationalCapacity,
                setupTime: formData.setupTime,
                qualificationId: formData.qualificationId,
            }

            const updatedResource = await updatePhysicalResource(resource.id, dto);
            toast.success(t("physicalResource.success.updated"));
            onUpdated(updatedResource);
        } catch (err) {
            const error = err as Error;
            setError(error);
            toast.error(error.message || t("physicalResource.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 300);
    };

    if (!isOpen && !isAnimatingOut) {
        return null;
    }

    return (
        <div className={`pr-modal-overlay ${isAnimatingOut ? 'anim-out' : ''}`}>
            {}
            <form onSubmit={handleSubmit} className={`pr-details-modal-content ${isAnimatingOut ? 'anim-out' : ''}`}>

                {}
                <div className="pr-details-hero">
                    <div className="hero-icon-wrapper">
                        {getResourceIcon(resource.physicalResourceType)}
                    </div>
                    <div className="hero-text">
                        <h2>{t("physicalResource.editModalTitle", { code: resource.code.value })}</h2>
                        {}
                        <p className="details-description">{t(`physicalResource.types.${resource.physicalResourceType}`)}</p>
                    </div>
                </div>

                {}
                <div className="pr-details-grid pr-edit-grid">

                    {}
                    <div className="info-card editable-card">
                        <div className="info-card-header">
                            <span>📝</span> {t("physicalResource.form.description")}
                        </div>
                        <div className="info-card-body-editable">
                            <input
                                type="text"
                                id="description"
                                name="description"
                                className="info-card-input"
                                value={formData.description || ""}
                                onChange={handleChange}
                                placeholder={t("physicalResource.form.descriptionPlaceholder")}
                                required
                            />
                        </div>
                    </div>

                    {}
                    <div className="info-card editable-card">
                        <div className="info-card-header">
                            <span>🎓</span> {t("physicalResource.form.qualification")}
                        </div>
                        <div className="info-card-body-editable">
                            <select
                                id="qualificationId"
                                name="qualificationId"
                                className="info-card-input"
                                value={formData.qualificationId ?? ""}
                                onChange={handleChange}
                            >
                                <option value="">{t("physicalResource.form.selectOptionNone")}</option>
                                {qualifications.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {q.name} ({q.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {}
                    <div className="info-card editable-card">
                        <div className="info-card-header">
                            <span>⚙️</span> {t("physicalResource.form.operationalCapacity")}
                        </div>
                        <div className="info-card-body-editable">
                            <input
                                type="number"
                                id="operationalCapacity"
                                name="operationalCapacity"
                                className="info-card-input"
                                value={formData.operationalCapacity ?? ""}
                                onChange={handleChange}
                                placeholder={t("physicalResource.form.capacityPlaceholder")}
                                min="0"
                            />
                        </div>
                    </div>

                    {}
                    <div className="info-card editable-card">
                        <div className="info-card-header">
                            <span>⏱️</span> {t("physicalResource.form.setupTime")}
                        </div>
                        <div className="info-card-body-editable">
                            <input
                                type="number"
                                id="setupTime"
                                name="setupTime"
                                className="info-card-input"
                                value={formData.setupTime ?? ""}
                                onChange={handleChange}
                                placeholder={t("physicalResource.form.setupTimePlaceholder")}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="pr-edit-error-bar">
                        <p className="pr-error-message">{error.message}</p>
                    </div>
                )}

                {}
                <div className="pr-modal-actions">
                    <button type="button" onClick={handleClose} className="pr-cancel-button" disabled={isLoading}>
                        {t("physicalResource.actions.cancel")}
                    </button>
                    <button type="submit" className="pr-submit-button" disabled={isLoading}>
                        {isLoading ? t("physicalResource.actions.saving") : t("physicalResource.actions.save")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PhysicalResourceEditModal;