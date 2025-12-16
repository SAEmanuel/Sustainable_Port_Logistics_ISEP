import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import "../style/incidentType.css";
import type { CreateIncidentTypeDTO } from "../dtos/createIncidentTypeDTO";
import type { Severity, IncidentType } from "../domain/incidentType";
import { createIncidentType, getIncidentTypeRoots } from "../services/incidentTypeService";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const severities: Severity[] = ["Minor", "Major", "Critical"];

const initialData: Partial<CreateIncidentTypeDTO> = {
    code: "",
    name: "",
    description: "",
    severity: "Minor",
    parentCode: null
};

function IncidentTypeCreateModal({ isOpen, onClose, onCreated }: Props) {
    const { t } = useTranslation();

    const [step, setStep] = useState(1);
    const [roots, setRoots] = useState<IncidentType[]>([]);
    const [formData, setFormData] = useState<Partial<CreateIncidentTypeDTO>>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFormData(initialData);
            setError(null);
            setRoots([]);
            return;
        }

        // Load roots for parent selection
        (async () => {
            try {
                const data = await getIncidentTypeRoots();
                setRoots(data);
            } catch {
                toast.error(t("incidentType.errors.loadRoots"));
            }
        })();
    }, [isOpen]);

    const handleParentSelect = (parentCode: string | null) => {
        setFormData(prev => ({ ...prev, parentCode }));
        setStep(2);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.code || formData.code.trim() === "") {
            const msg = t("incidentType.errors.codeRequired") || "Code is required.";
            setError(new Error(msg));
            toast.error(msg);
            return;
        }
        if (!formData.name || formData.name.trim() === "") {
            const msg = t("incidentType.errors.nameRequired") || "Name is required.";
            setError(new Error(msg));
            toast.error(msg);
            return;
        }

        setIsLoading(true);
        try {
            const dtoToSend: CreateIncidentTypeDTO = {
                code: formData.code!.trim(),
                name: formData.name!.trim(),
                description: (formData.description ?? "").trim(),
                severity: (formData.severity ?? "Minor") as Severity,
                parentCode: formData.parentCode ?? null
            };

            await createIncidentType(dtoToSend);
            toast.success(t("incidentType.success.created"));
            onCreated();
        } catch (err) {
            const apiError = err as Error;
            setError(apiError);
            toast.error(apiError.message || t("incidentType.errors.createFailedGeneric"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="it-modal-overlay">
            <div className="it-modal-content">
                <div className="it-wizard-progress">
                    <div className={`it-wizard-step ${step >= 1 ? "active" : ""} ${step > 1 ? "complete" : ""}`}>
                        <div className="step-dot">1</div>
                        <span>{t("incidentType.steps.parent")}</span>
                    </div>
                    <div className={`it-wizard-step ${step >= 2 ? "active" : ""}`}>
                        <div className="step-dot">2</div>
                        <span>{t("incidentType.steps.details")}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div>
                            <h3>{t("incidentType.selectParent")}</h3>

                            <div className="it-type-selection-grid">
                                <div className="it-type-card" onClick={() => handleParentSelect(null)}>
                                    <div className="type-card-icon">🌳</div>
                                    <div>{t("incidentType.parent.none")}</div>
                                </div>

                                {roots.map(r => (
                                    <div key={r.id} className="it-type-card" onClick={() => handleParentSelect(r.code)}>
                                        <div className="type-card-icon">📁</div>
                                        <div>{r.code} – {r.name}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="it-modal-actions-wizard">
                                <button type="button" onClick={onClose} className="it-cancel-button">
                                    {t("actions.cancel")}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="it-form-group">
                                <label>{t("incidentType.form.code")}</label>
                                <input
                                    required
                                    name="code"
                                    type="text"
                                    value={formData.code}
                                    onChange={handleValueChange}
                                    placeholder="T-INC001"
                                />
                            </div>

                            <div className="it-form-group">
                                <label>{t("incidentType.form.name")}</label>
                                <input
                                    required
                                    name="name"
                                    type="text"
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
                                    value={formData.severity ?? "Minor"}
                                    onChange={handleValueChange}
                                >
                                    {severities.map(s => (
                                        <option key={s} value={s}>{t(`incidentType.severity.${s}`)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="it-form-group">
                                <label>{t("incidentType.form.parent")}</label>
                                <input
                                    type="text"
                                    value={formData.parentCode ?? ""}
                                    disabled
                                    className="info-card-input"
                                />
                            </div>

                            {error && <p className="it-error-message">{error.message}</p>}

                            <div className="it-modal-actions-wizard">
                                <button type="button" onClick={() => setStep(1)} className="it-cancel-button">
                                    {t("actions.back")}
                                </button>
                                <button type="submit" disabled={isLoading} className="it-submit-button">
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

export default IncidentTypeCreateModal;
