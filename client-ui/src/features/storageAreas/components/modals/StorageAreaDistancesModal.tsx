import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { StorageArea } from "../../domain/storageArea";

type Props = {
    open: boolean;
    storageArea: StorageArea | null;
    onClose: () => void;
};

export function StorageAreaDistancesModal({ open, storageArea, onClose }: Props) {
    const { t } = useTranslation();

    if (!open || !storageArea) return null;

    const distances = storageArea.distancesToDocks;
    const max = Math.max(
        ...distances.map(x => x.distance || 0),
        1
    );

    return (
        <div className="sa-modal-backdrop" onClick={onClose}>
    <div className="sa-dock-modal" onClick={e => e.stopPropagation()}>
    <div className="sa-dock-head">
    <div className="sa-dock-spacer" />
    <h3 className="sa-dock-title">
        {t("storageAreas.list.distancesTitle", { name: storageArea.name })}
    </h3>
    <button
    className="sa-icon-btn sa-dock-close"
    onClick={onClose}
    aria-label={t("storageAreas.modal.close") || "Close"}
>
    <FaTimes />
    </button>
    </div>

    <div className="sa-dock-body">
        {distances.length === 0 ? (
                <div className="sa-empty">
                    {t("storageAreas.list.noDistances")}
        </div>
) : (
        distances.map((d, i) => {
            const pct = Math.max(
                8,
                Math.round(((d.distance || 0) / max) * 100)
            );

            return (
                <div
                    className="sa-dock-row"
            key={d.dockCode}
            style={{ ["--delay" as any]: `${i * 60}ms` }}
        >
            <div className="sa-dock-label">{d.dockCode}</div>
                <div className="sa-dock-bar">
            <div
                className="sa-dock-fill"
            style={{ width: `${pct}%` }}
        >
            <span className="sa-dock-value">
                {d.distance}
                </span>
                </div>
                </div>
                </div>
        );
        })
    )}
    </div>
    </div>
    </div>
);
}
