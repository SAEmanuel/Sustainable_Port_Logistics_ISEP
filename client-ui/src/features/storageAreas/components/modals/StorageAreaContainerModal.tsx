import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Container } from "../../domain/storageArea";

type CellPos = { bay: number; row: number; tier: number };

type Props = {
    open: boolean;
    loading: boolean;
    error: string | null;
    info: Container | null;
    cellPos: CellPos | null;
    onClose: () => void;
};

export function StorageAreaContainerModal({
                                              open,
                                              loading,
                                              error,
                                              info,
                                              cellPos,
                                              onClose,
                                          }: Props) {
    const { t } = useTranslation();

    if (!open) return null;

    return (
        <div className="sa-modal-backdrop" onClick={onClose}>
            <div className="sa-container-modal" onClick={e => e.stopPropagation()}>
                <div className="sa-dock-head">
                    <div className="sa-dock-spacer" />
                    <h3 className="sa-dock-title">
                        {cellPos
                            ? t("storageAreas.modal.container.title", {
                                bay: cellPos.bay,
                                row: cellPos.row,
                                tier: cellPos.tier,
                            })
                            : t("storageAreas.modal.container.titleFallback")}
                    </h3>
                    <button
                        className="sa-icon-btn sa-dock-close"
                        onClick={onClose}
                        aria-label={t("storageAreas.modal.close") || "Close"}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="sa-modal-body-modern">
                    {loading && (
                        <div
                            className="sa-spinner-lg"
                            aria-label={
                                t("storageAreas.modal.container.loading") ||
                                "Loading"
                            }
                        />
                    )}

                    {error && !loading && (
                        <div className="sa-modal-error">⚠️ {error}</div>
                    )}

                    {!loading && !error && info && (
                        <div className="sa-info-grid">
                            <div className="sa-info-card">
                                <span>
                                    {t("storageAreas.modal.container.isoNumber")}
                                </span>
                                <strong>{info.isoNumber}</strong>
                            </div>
                            <div className="sa-info-card">
                                <span>
                                    {t("storageAreas.modal.container.description")}
                                </span>
                                <strong>{info.description}</strong>
                            </div>
                            <div className="sa-info-card">
                                <span>
                                    {t("storageAreas.modal.container.type")}
                                </span>
                                <strong className="sa-tag-chip sa-chip-general">
                                    {info.containerType}
                                </strong>
                            </div>
                            <div className="sa-info-card">
                                <span>
                                    {t("storageAreas.modal.container.status")}
                                </span>
                                <strong
                                    className={`sa-tag-chip sa-chip-${(info.containerStatus ||
                                        "unknown")
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")}`}
                                >
                                    {info.containerStatus}
                                </strong>
                            </div>
                            <div className="sa-info-card">
                                <span>
                                    {t("storageAreas.modal.container.weight")}
                                </span>
                                <strong>
                                    {t(
                                        "storageAreas.modal.container.weight_unit",
                                        { value: info.weight }
                                    )}
                                </strong>
                            </div>
                        </div>
                    )}

                    {!loading && !error && !info && (
                        <div className="sa-modal-error">
                            {t("storageAreas.modal.container.noData")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
