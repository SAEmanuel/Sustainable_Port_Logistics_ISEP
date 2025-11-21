// src/features/docks/components/DockCreateModal.tsx

import type { Dispatch, SetStateAction } from "react";
import type { VesselType } from "../../vesselsTypes/domain/vesselType";

type CreateStatus = "Available" | "Unavailable" | "Maintenance";

type CreateData = {
    code: string;
    location: string;
    status: CreateStatus;
};

type CreateNums = {
    lengthM: string;
    depthM: string;
    maxDraftM: string;
};

type CreateErrors = {
    code?: string;
    location?: string;
    lengthM?: string;
    depthM?: string;
    maxDraftM?: string;
    vessels?: string;
    numbers?: string;
};

type Props = {
    isOpen: boolean;
    t: (key: string, opts?: any) => string;

    createData: CreateData;
    setCreateData: Dispatch<SetStateAction<CreateData>>;

    createNums: CreateNums;
    setCreateNums: Dispatch<SetStateAction<CreateNums>>;

    createPRs: string[];
    setCreatePRs: Dispatch<SetStateAction<string[]>>;

    createVTs: string[];
    setCreateVTs: Dispatch<SetStateAction<string[]>>;

    createErrors: CreateErrors;
    setCreateErrors: Dispatch<SetStateAction<CreateErrors>>;

    availablePRsForCreate: string[];
    vesselTypes: VesselType[];
    allKnownCodes: string[];

    onSave: () => void;
    onClose: () => void;
};

const codeRegex = /^DK-\d{4}$/i;

const sanitizeLocation = (s: string) =>
    s
        .replace(/[^a-zA-Z0-9À-ÿ\s\-_/.,]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

export function DockCreateModal({
                                    isOpen,
                                    t,
                                    createData,
                                    setCreateData,
                                    createNums,
                                    setCreateNums,
                                    createPRs,
                                    setCreatePRs,
                                    createVTs,
                                    setCreateVTs,
                                    createErrors,
                                    setCreateErrors,
                                    availablePRsForCreate,
                                    vesselTypes,
                                    allKnownCodes,
                                    onSave,
                                    onClose,
                                }: Props) {
    if (!isOpen) return null;

    const handleCodeChange = (value: string) => {
        const v = value.toUpperCase();
        setCreateData((prev) => ({ ...prev, code: v }));
        if (createErrors.code) {
            setCreateErrors((p) => ({ ...p, code: undefined }));
        }
    };

    const handleCodeBlur = (raw: string) => {
        const v = raw.toUpperCase().trim();
        if (!v) return;

        if (!codeRegex.test(v)) {
            setCreateErrors((p) => ({
                ...p,
                code: t("Dock.errors.codeFormat", {
                    defaultValue: "Formato DK-0000",
                }),
            }));
            return;
        }

        if (allKnownCodes.includes(v)) {
            setCreateErrors((p) => ({
                ...p,
                code: t("Dock.errors.codeDuplicate", {
                    defaultValue: "Já existe uma dock com esse código",
                }),
            }));
        }
    };

    const handleLocationChange = (raw: string) => {
        const v = sanitizeLocation(raw);
        setCreateData((prev) => ({ ...prev, location: v }));
        if (createErrors.location) {
            setCreateErrors((p) => ({ ...p, location: undefined }));
        }
    };

    const handleLengthChange = (value: string) => {
        setCreateNums((prev) => ({ ...prev, lengthM: value }));
        if (createErrors.lengthM) {
            setCreateErrors((p) => ({ ...p, lengthM: undefined }));
        }
    };

    const handleDepthChange = (value: string) => {
        setCreateNums((prev) => ({ ...prev, depthM: value }));
        if (createErrors.depthM) {
            setCreateErrors((p) => ({ ...p, depthM: undefined }));
        }
    };

    const handleMaxDraftChange = (value: string) => {
        setCreateNums((prev) => ({ ...prev, maxDraftM: value }));
        if (createErrors.maxDraftM) {
            setCreateErrors((p) => ({ ...p, maxDraftM: undefined }));
        }
    };

    const normalizeDecimal = (value: string) => value.replace(",", ".");

    return (
        <div className="dk-modal-overlay">
            <div className="dk-modal">
                <h3>
                    {t("Dock.modal.addTitle", {
                        defaultValue: "Adicionar Dock",
                    })}
                </h3>

                <div className="dk-modal-body">
                    <label>
                        {t("Dock.fields.code", { defaultValue: "Código *" })}
                    </label>
                    <input
                        className={`dk-input ${createErrors.code ? "dk-input--error" : ""}`}
                        value={createData.code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onBlur={(e) => handleCodeBlur(e.target.value)}
                        placeholder="DK-0000"
                    />
                    {createErrors.code && (
                        <div className="dk-error-text">{createErrors.code}</div>
                    )}

                    <label>
                        {t("Dock.fields.location", {
                            defaultValue: "Localização *",
                        })}
                    </label>
                    <input
                        className={`dk-input ${
                            createErrors.location ? "dk-input--error" : ""
                        }`}
                        value={createData.location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                    />
                    {createErrors.location && (
                        <div className="dk-error-text">{createErrors.location}</div>
                    )}

                    <label>
                        {t("Dock.fields.status", { defaultValue: "Estado" })}
                    </label>
                    <select
                        className="dk-input"
                        value={createData.status}
                        onChange={(e) =>
                            setCreateData((prev) => ({
                                ...prev,
                                status: e.target.value as CreateStatus,
                            }))
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
                        className={`dk-input ${
                            createErrors.lengthM ? "dk-input--error" : ""
                        }`}
                        inputMode="decimal"
                        value={createNums.lengthM}
                        onChange={(e) => handleLengthChange(e.target.value)}
                        onBlur={(e) =>
                            setCreateNums((prev) => ({
                                ...prev,
                                lengthM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {createErrors.lengthM && (
                        <div className="dk-error-text">{createErrors.lengthM}</div>
                    )}

                    <label>
                        {t("Dock.fields.depth", {
                            defaultValue: "Profundidade (m)",
                        })}
                    </label>
                    <input
                        className={`dk-input ${
                            createErrors.depthM ? "dk-input--error" : ""
                        }`}
                        inputMode="decimal"
                        value={createNums.depthM}
                        onChange={(e) => handleDepthChange(e.target.value)}
                        onBlur={(e) =>
                            setCreateNums((prev) => ({
                                ...prev,
                                depthM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {createErrors.depthM && (
                        <div className="dk-error-text">{createErrors.depthM}</div>
                    )}

                    <label>
                        {t("Dock.fields.maxdraft", {
                            defaultValue: "Calado Máximo (m)",
                        })}
                    </label>
                    <input
                        className={`dk-input ${
                            createErrors.maxDraftM ? "dk-input--error" : ""
                        }`}
                        inputMode="decimal"
                        value={createNums.maxDraftM}
                        onChange={(e) => handleMaxDraftChange(e.target.value)}
                        onBlur={(e) =>
                            setCreateNums((prev) => ({
                                ...prev,
                                maxDraftM: normalizeDecimal(e.target.value),
                            }))
                        }
                    />
                    {createErrors.maxDraftM && (
                        <div className="dk-error-text">{createErrors.maxDraftM}</div>
                    )}

                    <label>
                        {t("Dock.fields.physicalResource", {
                            defaultValue: "Recursos Físicos (disponíveis)",
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
                        {availablePRsForCreate.map((code) => (
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
                                    checked={createPRs.includes(code)}
                                    onChange={(e) =>
                                        setCreatePRs((prev) =>
                                            e.target.checked
                                                ? [...prev, code]
                                                : prev.filter((x) => x !== code)
                                        )
                                    }
                                />
                                {code}
                            </label>
                        ))}
                        {availablePRsForCreate.length === 0 && (
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
                                    checked={createVTs.includes(vt.name)}
                                    onChange={(e) =>
                                        setCreateVTs((prev) =>
                                            e.target.checked
                                                ? [...prev, vt.name]
                                                : prev.filter((x) => x !== vt.name)
                                        )
                                    }
                                />
                                {vt.name}
                            </label>
                        ))}
                    </div>
                    {createErrors.vessels && (
                        <div className="dk-error-text">{createErrors.vessels}</div>
                    )}

                    <p style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                        {t("Dock.chips.summary", {
                            pr: createPRs.length,
                            vt: createVTs.length,
                            defaultValue:
                                "{{pr}} PR selecionado(s) • {{vt}} tipo(s) de navio",
                        })}
                    </p>
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
