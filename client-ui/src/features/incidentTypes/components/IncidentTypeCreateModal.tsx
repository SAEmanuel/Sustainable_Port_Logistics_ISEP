import { useEffect, useMemo, useState } from "react";
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
    parentCode: null,
};

function IncidentTypeCreateModal({ isOpen, onClose, onCreated }: Props) {
    const { t } = useTranslation();

    const [step, setStep] = useState<1 | 2>(1);
    const [roots, setRoots] = useState<IncidentType[]>([]);
    const [parentSearch, setParentSearch] = useState("");
    const [selectedParent, setSelectedParent] = useState<IncidentType | null>(null); // null => “Sem Pai / Raiz”

    const [formData, setFormData] = useState<Partial<CreateIncidentTypeDTO>>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setRoots([]);
            setParentSearch("");
            setSelectedParent(null);
            setFormData(initialData);
            setError(null);
            setIsLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await getIncidentTypeRoots();
                setRoots(data);
            } catch {
                toast.error(t("incidentType.errors.loadRoots"));
            }
        })();
    }, [isOpen, t]);

    const filteredRoots = useMemo(() => {
        const q = parentSearch.trim().toLowerCase();
        if (!q) return roots;

        return roots.filter((r) => {
            const hay = `${r.code} ${r.name} ${r.description ?? ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [roots, parentSearch]);

    const parentSummary = useMemo(() => {
        if (!selectedParent) return t("incidentType.parent.none");
        return `${selectedParent.code} — ${selectedParent.name}`;
    }, [selectedParent, t]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const goToDetails = () => setStep(2);

    const goBackToParent = () => setStep(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.code || formData.code.trim() === "") {
            const msg = t("incidentType.errors.codeRequired");
            setError(new Error(msg));
            toast.error(msg);
            return;
        }
        if (!formData.name || formData.name.trim() === "") {
            const msg = t("incidentType.errors.nameRequired");
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
                parentCode: selectedParent?.code ?? null,
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

    const hasResults = filteredRoots.length > 0;

    return (
        <div className="it-modal-overlay">
            <div className="it-modal-content it-modal-content--wide">
                {/* Header */}
                <div className="it-modal-header">
                    <div>
                        <h2 className="it-modal-title">{t("incidentType.createModal.title")}</h2>
                        <p className="it-modal-subtitle">{t("incidentType.createModal.subtitle")}</p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="it-stepper">
                    <div className={`it-step ${step === 1 ? "active" : "complete"}`}>
                        <div className="it-step-dot">{step === 1 ? "1" : "✓"}</div>
                        <div className="it-step-meta">
                            <div className="it-step-title">{t("incidentType.steps.parent")}</div>
                            <div className="it-step-desc">{t("incidentType.steps.parentDesc")}</div>
                        </div>
                    </div>

                    <div className={`it-step ${step === 2 ? "active" : ""}`}>
                        <div className="it-step-dot">2</div>
                        <div className="it-step-meta">
                            <div className="it-step-title">{t("incidentType.steps.details")}</div>
                            <div className="it-step-desc">{t("incidentType.steps.detailsDesc")}</div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                {step === 1 && (
                    <div className="it-step-body">
                        <div className="it-parent-header">
                            <div>
                                <h3 className="it-section-title">{t("incidentType.selectParent")}</h3>
                                <p className="it-section-help">{t("incidentType.parent.help")}</p>
                            </div>

                            <div className="it-parent-meta">
                <span className="it-count-pill">
                  {t("incidentType.parent.resultsCount", { count: filteredRoots.length })}
                </span>
                            </div>
                        </div>

                        <div className="it-parent-search">
                            <input
                                type="text"
                                value={parentSearch}
                                onChange={(e) => setParentSearch(e.target.value)}
                                placeholder={t("incidentType.parent.searchPlaceholder")}
                                className="it-search-input it-search-input--soft"
                            />
                            {parentSearch.trim() !== "" && (
                                <button
                                    type="button"
                                    className="it-clear-inline"
                                    onClick={() => setParentSearch("")}
                                    aria-label={t("actions.clear")}
                                    title={t("actions.clear")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="it-parent-grid">
                            {/* Root option */}
                            <button
                                type="button"
                                className={`it-parent-card ${selectedParent === null ? "selected" : ""}`}
                                onClick={() => setSelectedParent(null)}
                            >
                                <div className="it-parent-icon">🌳</div>
                                <div className="it-parent-text">
                                    <div className="it-parent-title">{t("incidentType.parent.none")}</div>
                                    <div className="it-parent-sub">{t("incidentType.parent.noneDesc")}</div>
                                </div>
                            </button>

                            {/* Existing roots */}
                            {hasResults ? (
                                filteredRoots.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        className={`it-parent-card ${selectedParent?.code === r.code ? "selected" : ""}`}
                                        onClick={() => setSelectedParent(r)}
                                    >
                                        <div className="it-parent-icon">📁</div>
                                        <div className="it-parent-text">
                                            <div className="it-parent-title">{r.code}</div>
                                            <div className="it-parent-sub">{r.name}</div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="it-parent-empty">
                                    <div className="it-parent-empty-title">{t("incidentType.parent.noResults")}</div>
                                    <div className="it-parent-empty-sub">{t("incidentType.parent.noResultsHint")}</div>
                                </div>
                            )}
                        </div>

                        <div className="it-modal-actions-wizard it-modal-actions-wizard--single">
                            <button type="button" onClick={onClose} className="it-cancel-button">
                                {t("actions.cancel")}
                            </button>
                            <button type="button" onClick={goToDetails} className="it-submit-button">
                                {t("actions.next")}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="it-step-body">
                        <div className="it-details-header">
                            <div className="it-parent-summary">
                                <span className="it-parent-summary-label">{t("incidentType.parent.selected")}</span>
                                <span className="it-parent-summary-value">{parentSummary}</span>
                            </div>
                        </div>

                        <div className="it-form-grid">
                            <div className="it-form-group">
                                <label>{t("incidentType.form.code")}</label>
                                <input
                                    required
                                    name="code"
                                    type="text"
                                    value={formData.code ?? ""}
                                    onChange={handleValueChange}
                                    placeholder={t("incidentType.form.codePH")}
                                />
                            </div>

                            <div className="it-form-group">
                                <label>{t("incidentType.form.name")}</label>
                                <input
                                    required
                                    name="name"
                                    type="text"
                                    value={formData.name ?? ""}
                                    onChange={handleValueChange}
                                    placeholder={t("incidentType.form.namePH")}
                                />
                            </div>

                            <div className="it-form-group it-form-group--full">
                                <label>{t("incidentType.form.description")}</label>
                                <input
                                    name="description"
                                    type="text"
                                    value={formData.description ?? ""}
                                    onChange={handleValueChange}
                                    placeholder={t("incidentType.form.descriptionPH")}
                                />
                            </div>

                            <div className="it-form-group">
                                <label>{t("incidentType.form.severity")}</label>
                                <select name="severity" value={(formData.severity ?? "Minor") as Severity} onChange={handleValueChange}>
                                    {severities.map((s) => (
                                        <option key={s} value={s}>
                                            {t(`incidentType.severity.${s}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* IMPORTANTE:
                  - Não mostramos o “Código do Pai” como input quando é Sem Pai.
                  - Mesmo quando há pai, já mostramos a seleção no header (parentSummary), portanto não precisamos de campo extra.
               */}
                        </div>

                        {error && <p className="it-error-message">{error.message}</p>}

                        <div className="it-modal-actions-wizard">
                            <button type="button" onClick={goBackToParent} className="it-cancel-button">
                                {t("actions.back")}
                            </button>

                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button type="button" onClick={onClose} className="it-clear-button">
                                    {t("actions.cancel")}
                                </button>
                                <button type="submit" disabled={isLoading} className="it-submit-button">
                                    {isLoading ? t("common.saving") : t("actions.create")}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default IncidentTypeCreateModal;
