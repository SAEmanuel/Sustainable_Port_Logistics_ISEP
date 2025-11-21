// src/features/docks/components/DockEditModal.tsx

import type { Dispatch, SetStateAction } from "react";
import type { VesselType } from "../../vesselsTypes/domain/vesselType";
import type { UpdateDockRequest } from "../domain/dock";

type EditNums = {
    lengthM: string;
    depthM: string;
    maxDraftM: string;
};

type EditErrors = {
    location?: string;
    lengthM?: string;
    depthM?: string;
    maxDraftM?: string;
    vessels?: string;
};

type Props = {
    isOpen: boolean;
    t: (key: string, opts?: any) => string;

    editData: UpdateDockRequest;
    setEditData: Dispatch<SetStateAction<UpdateDockRequest>>;

    editNums: EditNums;
    setEditNums: Dispatch<SetStateAction<EditNums>>;

    editPRs: string[];
    setEditPRs: Dispatch<SetStateAction<string[]>>;

    editVTs: string[];
    setEditVTs: Dispatch<SetStateAction<string[]>>;

    errors: EditErrors;
    setErrors: Dispatch<SetStateAction<EditErrors>>;

    availablePRsForEdit: string[];
    vesselTypes: VesselType[];

    onSave: () => void;
    onClose: () => void;
};

const sanitizeLocation = (s: string) =>
    s
        .replace(/[^a-zA-Z0-9À-ÿ\s\-_/.,]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

const normalizeDecimal = (value: string) => value.replace(",", ".");

export function DockEditModal({
                                  isOpen,
                                  t,
                                  editData,
                                  setEditData,
                                  editNums,
                                  setEditNums,
                                  editPRs,
                                  setEditPRs,
                                  editVTs,
                                  setEditVTs,
                                  errors,
                                  setErrors,
                                  availablePRsForEdit,
                                  vesselTypes,
                                  onSave,
                                  onClose,
                              }: Props) {
    if (!isOpen) return null;

    const handleLocationChange = (raw: string) => {
        const v = sanitizeLocation(raw);
        setEditData((prev) => ({ ...prev, location: v }));
        if (errors.location) {
            setErrors((p) => ({ ...p, location: undefined }));
        }
    };

    const handleLengthChange = (value: string) => {
        setEditNums((prev) => ({ ...prev, lengthM: value }));
        if (errors.lengthM) {
            setErrors((p) => ({ ...p, lengthM: undefined }));
        }
    };

    const handleDepthChange = (value: string) => {
        setEditNums((prev) => ({ ...prev, depthM: value }));
        if (errors.depthM) {
            setErrors((p) => ({ ...p, depthM: undefined }));
        }
    };

    const handleMaxDraftChange = (value: string) => {
        setEditNums((prev) => ({ ...prev, maxDraftM: value }));
        if (errors.maxDraftM) {
            setErrors((p) => ({ ...p, maxDraftM: undefined }));
        }
    };

    return (
        <div className="dk-modal-overlay">
            <div className="dk-modal">
                <h3>
                    {t("Dock.modal.editTitle", { defaultValue: "Editar Dock" })}
                </h3>

                <div className="dk-modal-body">
                    <label>
                        {t("Dock.fields.location", {
                            defaultValue: "Localização *",
                        })}
                    </label>
                    <input
                        className={`dk-input ${errors.location ? "dk-input--error" : ""}`}
                        value={editData.location || ""}
                        onChange={(e) => handleLocationChange(e.target.value)}
                    />
                    {errors.location && (
                        <div className="dk-error-text">{errors.location}</div>
                    )}

                    <label>
                        {t("Dock.fields.status", { defaultValue: "Estado" })}
                    </label>
                    <select
                        className="dk-input"
                        value={editData.status ?? ""}
                        onChange={(e) =>
                            setEditData((prev) => ({ ...prev, status: e.target.value }))
                        }
                    >
                        <option value="Available">
                            {t("Dock.status.Available", {
                                defaultValue: "Disponível",
                            })}
                        </option>
                        <option value="Unavailable">
                            {t("Dock.status.Unavailable", {
                                defaultValue: "Indisponível",
                            })}
                        </option>
                        <option value="Maintenance">
                            {t("Dock.status.Maintenance", {
                                defaultValue: "Manutenção",
                            })}
                        </option>
                    </select>

                    <label>
                        {t("Dock.fields.length", {
                            defaultValue: "Comprimento (m)",
                        })}
                    </label>
                    <input
                        className={`dk-input ${errors.lengthM ? "dk-input--error" : ""}`}
                        type="text"
                        inputMode="decimal"
                        value={editNums.lengthM}
                        onChange={(e) => handleLengthChange(e.target.value)}
                        onBlur={(e) =>
                            setEditNums((prev) => ({
                                ...prev,
                                lengthM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {errors.lengthM && (
                        <div className="dk-error-text">{errors.lengthM}</div>
                    )}

                    <label>
                        {t("Dock.fields.depth", {
                            defaultValue: "Profundidade (m)",
                        })}
                    </label>
                    <input
                        className={`dk-input ${errors.depthM ? "dk-input--error" : ""}`}
                        type="text"
                        inputMode="decimal"
                        value={editNums.depthM}
                        onChange={(e) => handleDepthChange(e.target.value)}
                        onBlur={(e) =>
                            setEditNums((prev) => ({
                                ...prev,
                                depthM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {errors.depthM && (
                        <div className="dk-error-text">{errors.depthM}</div>
                    )}

                    <label>
                        {t("Dock.fields.maxdraft", {
                            defaultValue: "Calado Máximo (m)",
                        })}
                    </label>
                    <input
                        className={`dk-input ${errors.maxDraftM ? "dk-input--error" : ""}`}
                        type="text"
                        inputMode="decimal"
                        value={editNums.maxDraftM}
                        onChange={(e) => handleMaxDraftChange(e.target.value)}
                        onBlur={(e) =>
                            setEditNums((prev) => ({
                                ...prev,
                                maxDraftM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {errors.maxDraftM && (
                        <div className="dk-error-text">{errors.maxDraftM}</div>
                    )}

                    <label>
                        {t("Dock.details.physicalResource", {
                            defaultValue: "Recursos Físicos",
                        })}
                    </label>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            maxHeight: 160,
                            overflow: "auto",
                        }}
                    >
                        {availablePRsForEdit.map((code) => (
                            <label
                                key={code}
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={editPRs.includes(code)}
                                    onChange={(e) =>
                                        setEditPRs((prev) =>
                                            e.target.checked
                                                ? [...prev, code]
                                                : prev.filter((x) => x !== code)
                                        )
                                    }
                                />
                                {code}
                            </label>
                        ))}
                        {availablePRsForEdit.length === 0 && (
                            <span className="dk-chip">
                                {t("Dock.messages.noAvailablePR", {
                                    defaultValue: "Sem recursos disponíveis",
                                })}
                            </span>
                        )}
                    </div>

                    <label>
                        {t("Dock.fields.vesselType", {
                            defaultValue: "Tipos de Navio Permitidos",
                        })}
                    </label>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            maxHeight: 160,
                            overflow: "auto",
                        }}
                    >
                        {vesselTypes.map((vt) => (
                            <label
                                key={vt.id}
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={editVTs.includes(vt.id)}
                                    onChange={(e) => {
                                        setEditVTs((prev) =>
                                            e.target.checked
                                                ? [...prev, vt.id]
                                                : prev.filter((x) => x !== vt.id)
                                        );
                                        if (errors.vessels) {
                                            setErrors((p) => ({ ...p, vessels: undefined }));
                                        }
                                    }}
                                />
                                {vt.name}
                            </label>
                        ))}
                    </div>
                    {errors.vessels && (
                        <div className="dk-error-text">{errors.vessels}</div>
                    )}
                </div>

                <div className="dk-modal-actions">
                    <button className="dk-btn-cancel" onClick={onClose}>
                        {t("Dock.buttons.cancel", { defaultValue: "Cancelar" })}
                    </button>
                    <button className="dk-btn-save" onClick={onSave}>
                        {t("Dock.buttons.save", { defaultValue: "Guardar" })}
                    </button>
                </div>
            </div>
        </div>
    );
}
