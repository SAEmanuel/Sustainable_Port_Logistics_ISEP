import type { FC } from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import type { Dock } from "../domain/dock";
import { val, vals } from "../utils/dockValueHelpers";

type DockSlidePanelProps = {
    dock: Dock;
    onClose: () => void;
    onEdit: (dock: Dock) => void;
    statusLabel: (s?: string | number) => string;
    vesselTypeNamesFor: (ids?: string[]) => string[];
};

export const DockSlidePanel: FC<DockSlidePanelProps> = ({
                                                            dock,
                                                            onClose,
                                                            onEdit,
                                                            statusLabel,
                                                            vesselTypeNamesFor,
                                                        }) => {
    const { t } = useTranslation();

    const allowedVesselTypeIds = vals(dock.allowedVesselTypeIds);
    const physicalResourceCodes = vals(dock.physicalResourceCodes);

    return (
        <div className="dk-slide">
            <button className="dk-slide-close" onClick={onClose}>
                <FaTimes />
            </button>

            <h3>{val(dock.code)}</h3>

            <p>
                <strong>
                    {t("Dock.details.location", {
                        defaultValue: "Localização",
                    })}
                    :
                </strong>{" "}
                {dock.location || "—"}
            </p>
            <p>
                <strong>
                    {t("Dock.details.status", { defaultValue: "Estado" })}:
                </strong>{" "}
                {statusLabel(dock.status)}
            </p>

            <p>
                <strong>
                    {t("Dock.details.vesselType", {
                        defaultValue: "Tipos de Navio",
                    })}
                    :
                </strong>
            </p>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 8,
                }}
            >
                {vesselTypeNamesFor(allowedVesselTypeIds).map((name) => (
                    <span className="dk-chip" key={name + "_sel"}>
                        {name}
                    </span>
                ))}
                {allowedVesselTypeIds.length === 0 && (
                    <span className="dk-chip">—</span>
                )}
            </div>

            {physicalResourceCodes.length ? (
                <>
                    <p>
                        <strong>
                            {t("Dock.details.physicalResource", {
                                defaultValue: "Recursos Físicos",
                            })}
                            :
                        </strong>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {physicalResourceCodes.map((c) => (
                            <span className="dk-chip" key={c + "_sel"}>
                                {c}
                            </span>
                        ))}
                    </div>
                </>
            ) : null}

            {(dock.lengthM || dock.depthM || dock.maxDraftM) && (
                <>
                    <p>
                        <strong>
                            {t("Dock.details.dimensions", {
                                defaultValue: "Dimensões (m)",
                            })}
                            :
                        </strong>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {dock.lengthM !== undefined && (
                            <span className="dk-chip">
                                {t("Dock.details.length", {
                                    defaultValue: "Comprimento",
                                })}
                                : {dock.lengthM}
                            </span>
                        )}
                        {dock.depthM !== undefined && (
                            <span className="dk-chip">
                                {t("Dock.details.depth", {
                                    defaultValue: "Profundidade",
                                })}
                                : {dock.depthM}
                            </span>
                        )}
                        {dock.maxDraftM !== undefined && (
                            <span className="dk-chip">
                                {t("Dock.details.maxdraft", {
                                    defaultValue: "Calado Máximo",
                                })}
                                : {dock.maxDraftM}
                            </span>
                        )}
                    </div>
                </>
            )}

            <div className="dk-slide-actions">
                <button className="dk-btn-edit" onClick={() => onEdit(dock)}>
                    {t("Dock.buttons.edit", { defaultValue: "Editar" })}
                </button>
            </div>
        </div>
    );
};
