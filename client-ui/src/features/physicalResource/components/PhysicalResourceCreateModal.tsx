import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
//import { notifyLoading, notifySuccess, notifyError } from "../../../utils/notify";
import toast from "react-hot-toast";
//import { FaUsers } from "react-icons/fa";
import "../style/physicalResource.css";
import { createPhysicalResource } from "../services/physicalResourceService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/types/qualification";
import type { CreatePhysicalResource } from "../types/physicalResource";
import  { PhysicalResourceType } from "../types/physicalResource";
import "../style/physicalResource.css";

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
    const [formData, setFormData] = useState<CreatePhysicalResource>(initialState);
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Buscar qualificações quando o modal abre
    useEffect(() => {
        if (isOpen) {
            const fetchQualifications = async () => {
                try {
                    const data = await getQualifications();
                    setQualifications(data);
                } catch (err) {
                    toast.error(t("physicalResource.errors.loadQualifications"));
                }
            };
            fetchQualifications();
        } else {
            setFormData(initialState);
            setError(null);
        }
    }, [isOpen, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Converter para número se for um campo numérico
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

    if (!isOpen) {
        return null;
    }

    return (
        <div className="pr-modal-overlay">
            <div className="pr-modal-content">
                <h2>{t("physicalResource.createModalTitle")}</h2>

                <form onSubmit={handleSubmit} className="pr-form">
                    {/* Description */}
                    <div className="pr-form-group">
                        <label htmlFor="description">{t("physicalResource.form.description")}</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
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

                    {/* Physical Resource Type */}
                    <div className="pr-form-group">
                        <label htmlFor="physicalResourceType">{t("physicalResource.form.type")}</label>
                        <select
                            id="physicalResourceType"
                            name="physicalResourceType"
                            value={formData.physicalResourceType ?? ""}
                            onChange={handleChange}
                        >
                            <option value="">{t("physicalResource.form.selectOption")}</option>
                            {}
                            {(Object.keys(PhysicalResourceType) as Array<keyof typeof PhysicalResourceType>).map((key) => (
                                <option key={key} value={PhysicalResourceType[key]}>
                                    {t(`physicalResource.types.${key}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Qualification Code */}
                    <div className="pr-form-group">
                        <label htmlFor="qualificationCode">{t("physicalResource.form.qualification")}</label>
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

                    {error && <p className="pr-error-message">{error.message}</p>}

                    <div className="pr-modal-actions">
                        <button type="button" onClick={onClose} className="pr-cancel-button" disabled={isLoading}>
                            {t("physicalResource.actions.cancel")}
                        </button>
                        <button type="submit" className="pr-submit-button" disabled={isLoading}>
                            {isLoading ? t("physicalResource.actions.creating") : t("physicalResource.actions.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PhysicalResourceCreateModal;