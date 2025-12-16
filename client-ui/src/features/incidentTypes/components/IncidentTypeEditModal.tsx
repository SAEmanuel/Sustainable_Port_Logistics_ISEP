import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import "../style/incidentType.css";
import type { IncidentType, Severity } from "../domain/incidentType";
import type { UpdateIncidentTypeDTO } from "../dtos/updateIncidentTypeDTO";
import { updateIncidentType, getIncidentTypeRoots } from "../services/incidentTypeService";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    resource: IncidentType;
}

const severities: Severity[] = ["Minor", "Major", "Critical"];

function IncidentTypeEditModal({ isOpen, onClose, onUpdated, resource }: Props) {
    const { t } = useTranslation();
    const [roots, setRoots] = useState<IncidentType[]>([]);
    const [formData, setFormData] = useState<UpdateIncidentTypeDTO>({
        name: resource.name,
        description: resource.description,
        severity: resource.severity,
        parentCode: resource.parentCode ?? null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: resource.name,
                description: resource.description,
                severity: resource.severity,
                parentCode: resource.parentCode ?? null
            });
            setError(null);

            (async () => {
                try {
                    const data = await getIncidentTypeRoots();
                    setRoots(data);
                } catch {
                    toast.error(t("incidentType.errors.loadRoots"));
                }
            })();
        }
    }, [isOpen, resource]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        const { name, value } = e.target;

        // parentCode: treat empty as null
        if (name === "parentCode") {
            setFormData(prev => ({ ...prev, parentCode: value === "" ? null : value }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || formData.name.trim() === "") {
            const msg = t("incidentType.errors.nameRequired");
            setError(new Error(msg));
            toast.error(msg);
            return;
        }

        setIsLoading(true);
        try {
            await updateIncidentType(resource.code, {
                name: formData.name.trim(),
                description: (formData.description ?? "").trim(),
                severity: formData.severity,
                parentCode: formData.parentCode ?? null
            });
            toast.success(t("incidentType.success.updated"));
            onUpdated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
            toast.error(apiError.message || t("incidentType.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // avoid setting itself as parent
    const availableParents = roots.filter(r => r.code !== resource.code);

    return (
        <div className="it-modal-overlay">
            <div className="it-modal-content">
                <h2>{t("incidentType.editModal.title")} - {resource.code}</h2>

                <form onSubmit={handleSubmit} className="it-form">
                    <div className="it-form-group">
                        <label>{t("incidentType.form.code")} ({t("incidentType.read-only")})</label>
                        <input type="text" value={resource.code} disabled className="info-card-input" />
                    </div>

                    <div className="it-form-group">
                        <label>{t("incidentType.form.name")}</label>
                        <input
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleValueChange}
                        />
                    </div>

                    <div className="it-form-group">
                        <label>{t("incidentType.form.description")}</label>
                        <input
                            name="description"
                            type="text"
                            value={formData.description}
                            onChange={handleValueChange}
                        />
                    </div>

                    <div className="it-form-group">
                        <label>{t("incidentType.form.severity")}</label>
                        <select
                            name="severity"
                            value={formData.severity}
                            onChange={handleValueChange}
                        >
                            {severities.map(s => (
                                <option key={s} value={s}>{t(`incidentType.severity.${s}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="it-form-group">
                        <label>{t("incidentType.form.parent")}</label>
                        <select
                            name="parentCode"
                            value={formData.parentCode ?? ""}
                            onChange={handleValueChange}
                        >
                            <option value="">{t("incidentType.parent.none")}</option>
                            {availableParents.map(p => (
                                <option key={p.id} value={p.code}>
                                    {p.code} – {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="it-error-message">{error.message}</p>}

                    <div className="it-modal-actions-wizard">
                        <button type="button" onClick={onClose} className="it-cancel-button">
                            {t("actions.cancel")}
                        </button>
                        <button type="submit" className="it-submit-button" disabled={isLoading}>
                            {isLoading ? t("common.saving") : t("actions.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default IncidentTypeEditModal;
