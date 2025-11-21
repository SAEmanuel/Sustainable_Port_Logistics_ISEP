import type { CSSProperties } from "react";

type TFn = (key: string, opts?: any) => string;

type Props = {
    slices: boolean[][][];
    maxBays: number;
    t: TFn;
    onCellClick: (bay: number, row: number, tier: number) => void;
};

function classNames(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

export function StorageAreaTiersGrid({ slices, maxBays, t, onCellClick }: Props) {
    if (!slices.length) {
        return (
            <div className="sa-empty">
                {t("storageAreas.list.noGrid")}
            </div>
        );
    }

    return (
        <section className="sa-visual">
            <div className="sa-visual-header">
                <h2>{t("storageAreas.list.tiersMap")}</h2>
                <span className="sa-note">{t("storageAreas.list.tiersNote")}</span>
            </div>

            <div className="sa-slices-grid">
                {slices.map((grid, tIdx) => (
                    <div className="sa-slice" key={`tier-${tIdx}`}>
                        <div className="sa-slice-head">
                            <span className="sa-tag">
                                {t("storageAreas.format.tier", { value: tIdx })}
                            </span>
                        </div>
                        <div className="sa-grid-wrap">
                            <div
                                className="sa-grid fit"
                                style={
                                    {
                                        ["--cols" as any]: String(maxBays),
                                        ["--gap" as any]: "4px",
                                    } as CSSProperties
                                }
                            >
                                {grid.map((row, r) =>
                                    row.map((cell, b) => (
                                        <div
                                            key={`c-${tIdx}-${r}-${b}`}
                                            className={classNames("sa-cell", cell && "filled")}
                                            onClick={() => {
                                                if (cell) onCellClick(b, r, tIdx);
                                            }}
                                            title={
                                                cell
                                                    ? `${t("storageAreas.format.bay", { value: b })} • ${t(
                                                        "storageAreas.format.row",
                                                        { value: r }
                                                    )} • ${t("storageAreas.format.tier", {
                                                        value: tIdx,
                                                    })}`
                                                    : undefined
                                            }
                                            role="button"
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
