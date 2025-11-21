// DockCardGrid.tsx
import type { FC } from "react";
import type { Dock } from "../domain/dock";
import { val, vals } from "../utils/dockValueHelpers";
import { useTranslation } from "react-i18next";

type DockCardGridProps = {
    docks: Dock[];
    loading: boolean;
    onSelect: (dock: Dock) => void;
    vesselTypeNamesFor: (ids?: string[]) => string[];
    statusLabel: (s?: string | number) => string;
};

export const DockCardGrid: FC<DockCardGridProps> = ({docks, 
                                                        loading,
                                                        onSelect,
                                                        vesselTypeNamesFor,
                                                        statusLabel,}) => {
    const { t } = useTranslation();

    if (loading) return null;

    return (
        <div className="dk-card-grid">
            {docks.map((d) => {
                const code = val(d.code);
                const vtIds = vals(d.allowedVesselTypeIds as any);
                const prCodes = vals(d.physicalResourceCodes as any);

                return (
                    <div
                        key={d.id}
                        className="dk-card"
                        onClick={() => onSelect(d)}
                    >
                        <div className="dk-card-header">
                            <span className="dk-card-title">{code}</span>
                            <span className="dk-badge">{statusLabel(d.status)}</span>
                        </div>
                        <div className="dk-card-body">
                            <div className="dk-row-item">
                <span className="dk-label">
                  {t("Dock.details.location", { defaultValue: "Localização" })}
                </span>
                                <span className="dk-chip">{d.location || "—"}</span>
                            </div>

                            <div className="dk-row-item">
                <span className="dk-label">
                  {t("Dock.details.vesselType", {
                      defaultValue: "Tipos de Navio",
                  })}
                </span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {vesselTypeNamesFor(vtIds).map((name) => (
                                        <span className="dk-chip" key={name + d.id}>
                      {name}
                    </span>
                                    ))}
                                    {vtIds.length === 0 && <span className="dk-chip">—</span>}
                                </div>
                            </div>

                            {!!prCodes.length && (
                                <div className="dk-row-item">
                  <span className="dk-label">
                    {t("Dock.details.physicalResource", {
                        defaultValue: "Recursos Físicos",
                    })}
                  </span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {prCodes.map((code) => (
                                            <span className="dk-chip" key={code + d.id}>
                        {code}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(d.lengthM || d.depthM || d.maxDraftM) && (
                                <div className="dk-row-item">
                  <span className="dk-label">
                    {t("Dock.details.dimensions", {
                        defaultValue: "Dimensões (m)",
                    })}
                  </span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {d.lengthM !== undefined && (
                                            <span className="dk-chip">
                        {t("Dock.details.length", {
                            defaultValue: "Comprimento",
                        })}
                                                : {d.lengthM}
                      </span>
                                        )}
                                        {d.depthM !== undefined && (
                                            <span className="dk-chip">
                        {t("Dock.details.depth", {
                            defaultValue: "Profundidade",
                        })}
                                                : {d.depthM}
                      </span>
                                        )}
                                        {d.maxDraftM !== undefined && (
                                            <span className="dk-chip">
                        {t("Dock.details.maxdraft", {
                            defaultValue: "Calado Máximo",
                        })}
                                                : {d.maxDraftM}
                      </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
