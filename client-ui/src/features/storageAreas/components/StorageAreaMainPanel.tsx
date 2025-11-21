import { useMemo } from "react";
import type { StorageAreaDto } from "../dto/storageAreaDtos";
import { StorageAreaTiersGrid } from "./StorageAreaTiersGrid";
import type { TFunction } from "i18next";

type Props = {
    selected: StorageAreaDto | null;
    slices: boolean[][][];
    t: TFunction;
    onOpenDistances: () => void;
    onCellClick: (bay: number, row: number, tier: number) => void;
};

/* Helpers locais */
function formatPct(num: number, den: number) {
    if (!den) return "0%";
    return `${Math.round((num / den) * 100)}%`;
}

/** Traduz backend type se tiveres enums / keys; senão devolve o original */
function xlateType(type: string, t: TFunction) {
    const key = type.toLowerCase();
    const map: Record<string, string> = {
        yard: t("storageAreas.enums.types.yard"),
        warehouse: t("storageAreas.enums.types.warehouse"),
    };
    return map[key] || type;
}

export function StorageAreaMainPanel({
                                         selected,
                                         slices,
                                         t,
                                         onOpenDistances,
                                         onCellClick,
                                     }: Props) {
    const capacityPct = useMemo(() => {
        if (!selected) return 0;
        const den = selected.maxCapacityTeu || 1;
        return Math.min(
            100,
            Math.round((selected.currentCapacityTeu / den) * 100)
        );
    }, [selected]);

    if (!selected) {
        return (
            <main className="sa-main">
                <div className="sa-empty">{t("storageAreas.list.selectOne")}</div>
            </main>
        );
    }

    return (
        <main className="sa-main">
            {/* INFO CARDS */}
            <section className="sa-kpis sa-kpis--extended">
                <div className="sa-card">
                    <div className="sa-card-title">
                        {t("storageAreas.list.type")}
                    </div>
                    <div className="sa-card-value">
                        {xlateType(selected.type, t)}
                    </div>
                </div>

                <div className="sa-card">
                    <div className="sa-card-title">
                        {t("storageAreas.list.capacity")}
                    </div>
                    <div className="sa-card-value">
                        {t("storageAreas.format.teu", {
                            current: selected.currentCapacityTeu,
                            max: selected.maxCapacityTeu,
                        })}
                    </div>
                    <div className="sa-progress">
                        <div
                            className="sa-progress-fill"
                            style={{ width: `${capacityPct}%` }}
                        />
                    </div>
                    <div className="sa-progress-label">
                        {formatPct(
                            selected.currentCapacityTeu,
                            selected.maxCapacityTeu
                        )}
                    </div>
                </div>

                <div className="sa-card">
                    <div className="sa-card-title">
                        {t("storageAreas.list.dimensions")}
                    </div>
                    <div className="sa-card-value">
                        {selected.maxBays} Bays · {selected.maxRows} Rows ·{" "}
                        {selected.maxTiers} Tiers
                    </div>
                </div>

                <div className="sa-card sa-card--desc">
                    <div className="sa-card-title">
                        {t("storageAreas.list.description")}
                    </div>
                    <p className="sa-desc">{selected.description || "-"}</p>
                </div>

                <div className="sa-card sa-card--resources">
                    <div className="sa-card-title">
                        {t("storageAreas.list.physical")}
                    </div>
                    <div className="sa-chips">
                        {selected.physicalResources.length === 0 ? (
                            <span className="sa-empty">–</span>
                        ) : (
                            selected.physicalResources.map(r => (
                                <span className="sa-chip" key={r}>
                                    {r}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div className="sa-card sa-card--button">
                    <div className="sa-card-title">
                        {t("storageAreas.list.docks")}
                    </div>
                    <button
                        className="sa-btn sa-btn-primary sa-btn-full"
                        onClick={onOpenDistances}
                    >
                        {t("storageAreas.list.viewDistances")}
                    </button>
                </div>
            </section>

            {/* GRID DE OCUPAÇÃO */}
            <StorageAreaTiersGrid
                slices={slices}
                maxBays={selected.maxBays}
                t={t}
                onCellClick={onCellClick}
            />
        </main>
    );
}
