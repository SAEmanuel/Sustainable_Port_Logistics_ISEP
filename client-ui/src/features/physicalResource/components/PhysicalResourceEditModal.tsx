import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
//import { toast } from "react-toastify";
import { updatePhysicalResource } from "../services/physicalResourceService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/types/qualification";
import type { PhysicalResource, UpdatePhysicalResource } from "../types/physicalResource";
import "../style/physicalResource.css";

interface PhysicalResourceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: (updatedResource: PhysicalResource) => void;
    resource: PhysicalResource; // O recurso que estamos a editar
}

function PhysicalResourceEditModal({ isOpen, onClose, onUpdated, resource }: PhysicalResourceEditModalProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UpdatePhysicalResource>({});
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Pré-popular o formulário quando o modal abre
    useEffect(() => {
        if (isOpen && resource) {
            setFormData({
                description: resource.description,
                operationalCapacity: resource.operationalCapacity,
                setupTime: resource.setupTime,
                qualificationId: resource.qualificationID || undefined,
            });
            setError(null);
        }
    }, [isOpen, resource]);

    // Buscar qualificações quando o modal abre
    useEffect(() => {
        if (isOpen) {
            const fetchQualifications = async () => {
                try {
                    const data = await getQualifications();
                    setQualifications(data);
                } catch (err) {
                    //toast.error(t("physicalResource.errors.loadQualifications"));
                }
            };
            fetchQualifications();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!formData.description) {
                throw new Error(t("physicalResource.errors.descriptionRequired"));
            }

            const updatedResource = await updatePhysicalResource(resource.id, formData);
            //toast.success(t("physicalResource.success.updated"));
            onUpdated(updatedResource); // Passa o recurso atualizado para o pai
        } catch (err) {
            const error = err as Error;
            setError(error);
            //toast.error(error.message || t("physicalResource.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="pr-modal-overlay">
            <div className="pr-modal-content">
                <h2>{t("physicalResource.editModalTitle", { code: resource.code.value })}</h2>

                <form onSubmit={handleSubmit} className="pr-form">
                    {/* Description */}
                    <div className="pr-form-group">
                        <label htmlFor="description">{t("physicalResource.form.description")}</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Operational Capacity */}
                    <div className="pr-form-group">
                        <label htmlFor="operationalCapacity">{t("physicalResource.form.operationalCapacity")}</label>
                        <input
                            type="number"
                            id="operationalCapacity"
                            name="operationalCapacity"
                            value={formData.operationalCapacity ?? ""}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    {/* Setup Time */}
                    <div className="pr-form-group">
                        <label htmlFor="setupTime">{t("physicalResource.form.setupTime")}</label>
                        <input
                            type="number"
                            id="setupTime"
                            name="setupTime"
                            value={formData.setupTime ?? ""}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    {/* Qualification ID */}
                    <div className="pr-form-group">
                        <label htmlFor="qualificationId">{t("physicalResource.form.qualification")}</label>
                        <select
                            id="qualificationId"
                            name="qualificationId" // Corresponde ao DTO 'UpdatingPhysicalResource'
                            value={formData.qualificationId ?? ""}
                            onChange={handleChange}
                        >
                            <option value="">{t("common.selectOptionNone")}</option>
                            {qualifications.map((q) => (
                                // No update, enviamos o ID (Guid) da qualificação
                                <option key={q.id} value={q.id}>
                                    {q.name} ({q.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="pr-error-message">{error.message}</p>}

                    <div className="pr-modal-actions">
                        <button type="button" onClick={onClose} className="pr-cancel-button" disabled={isLoading}>
                            {t("common.cancel")}
                        </button>
                        <button type="submit" className="pr-submit-button" disabled={isLoading}>
                            {isLoading ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PhysicalResourceEditModal;