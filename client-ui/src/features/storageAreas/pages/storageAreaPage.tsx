import { useEffect, useMemo, useState } from "react";
import { FaShip, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../style/storageAreaStyle.css";
import * as storageAreaService from "../service/storageAreaService";
import type { StorageAreaDto } from "../type/storageAreaType";
import { useTranslation } from "react-i18next";

/* Helpers */
function formatPct(num: number, den: number) {
    if (!den) return "0%";
    return `${Math.round((num / den) * 100)}%`;
}


function classNames(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}



function buildOccupancySlices(area: StorageAreaDto) {
    const total = area.maxBays * area.maxRows * area.maxTiers;
    const occupied = Math.min(area.currentCapacityTeu, total);
    const slices: boolean[][][] = [];
    for (let t = 0; t < area.maxTiers; t++) {
        const grid: boolean[][] = [];
        for (let r = 0; r < area.maxRows; r++) {
            const row: boolean[] = [];
            for (let b = 0; b < area.maxBays; b++) {
                const idx = t * (area.maxBays * area.maxRows) + r * area.maxBays + b;
                row.push(idx < occupied);
            }
            grid.push(row);
        }
        slices.push(grid);
    }
    return slices;
}


const GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export default function StorageAreaPage() {
    const { t } = useTranslation();
    const nav = useNavigate();
    /* State */
    const [items, setItems] = useState<StorageAreaDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<StorageAreaDto | null>(null);
    // Distances popup
    const [isDistancesOpen, setIsDistancesOpen] = useState(false);

    
    
    /* Effects */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await storageAreaService.getAllStorageAreas();
                setItems(data);
                if (data.length) setSelected(data[0]);
                toast.success(t("storageAreas.list.loaded", { count: data.length }));
            } catch (e: any) {
                toast.error(e?.response?.data ?? t("storageAreas.list.loading"));
            } finally {
                setLoading(false);
            }
        })();
    }, [t]);

    
    
    /* Derived */
    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase().trim();
        return items.filter((x) => {
            const matchesText =
                x.name.toLowerCase().includes(q) ||
                x.type.toLowerCase().includes(q) ||
                x.physicalResources.some((p) => p.toLowerCase().includes(q));
            const matchesId = GUID_RE.test(q) && x.id.toLowerCase() === q;
            return matchesText || matchesId;
        });
    }, [items, query]);

    
    
    const capacityPct = useMemo(() => {
        if (!selected) return 0;
        const den = selected.maxCapacityTeu || 1;
        return Math.min(100, Math.round((selected.currentCapacityTeu / den) * 100));
    }, [selected]);

    
    
    
    const slices = useMemo(
        () => (selected ? buildOccupancySlices(selected) : []),
        [selected]
    );

    
    
    
    /* Handlers */
    function goToCreate() {
        nav("/storage-areas/new");
    }

    
    
    
    
    
    return (
        <div className="sa-wrapper">

            {/* HEADER */}
            <div className="vt-title-area" style={{ marginBottom: "20px" }}>
                <div>
                    <h2 className="vt-title">
                        <FaShip /> {t("storageAreas.list.title")}
                    </h2>
                    <p className="vt-sub">
                        {t("storageAreas.list.registered", { count: filtered.length })}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <div className="sa-search" style={{ background: "var(--card-bg)", padding: "6px 10px" }}>
                        <FaSearch style={{ opacity: 0.7 }} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("storageAreas.list.searchPlaceholder") ?? ""}
                        />
                    </div>

                    <button className="vt-create-btn-top" onClick={goToCreate}>
                        <FaPlus /> {t("storageAreas.create.btnAdd") ?? "New"}
                    </button>
                </div>
            </div>

            {/* LIST + MAIN */}
            <div className="sa-content-vertical">

                {/* Horizontal list */}
                <div className="sa-strip">
                    <div className="sa-strip-inner">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <div className="sa-strip-skeleton" key={i} />)
                        ) : filtered.length === 0 ? (
                            <div className="sa-empty" style={{ padding: 10 }}>
                                {t("storageAreas.list.noResults")}
                            </div>
                        ) : (
                            filtered.map((x) => {
                                const active = selected?.id === x.id;
                                return (
                                    <button
                                        key={x.id}
                                        className={classNames("sa-card-mini", active && "active")}
                                        onClick={() => setSelected(x)}
                                    >
                                        <div className="sa-card-mini-top">
                                            <span className="sa-card-mini-name">{x.name}</span>
                                            <span className={`sa-badge-modern ${x.type.toLowerCase()}`}>{x.type}</span>
                                        </div>
                                        <div className="sa-card-mini-bottom">
                                            {x.currentCapacityTeu}/{x.maxCapacityTeu} TEU
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* MAIN */}
                <main className="sa-main">
                    {!selected ? (
                        <div className="sa-empty">{t("storageAreas.list.selectOne")}</div>
                    ) : (
                        <>
                            {/* KPIs */}
                            <section className="sa-kpis sa-kpis--extended">
                                <div className="sa-card">
                                    <div className="sa-card-title">{t("storageAreas.list.type")}</div>
                                    <div className="sa-card-value">{selected.type}</div>
                                </div>

                                <div className="sa-card">
                                    <div className="sa-card-title">{t("storageAreas.list.capacity")}</div>
                                    <div className="sa-card-value">
                                        {selected.currentCapacityTeu}/{selected.maxCapacityTeu} TEU
                                    </div>
                                    <div className="sa-progress">
                                        <div className="sa-progress-fill" style={{ width: `${capacityPct}%` }} />
                                    </div>
                                    <div className="sa-progress-label">
                                        {formatPct(selected.currentCapacityTeu, selected.maxCapacityTeu)}
                                    </div>
                                </div>

                                <div className="sa-card">
                                    <div className="sa-card-title">{t("storageAreas.list.dimensions")}</div>
                                    <div className="sa-card-value">
                                        {selected.maxBays} Bays · {selected.maxRows} Rows · {selected.maxTiers} Tiers
                                    </div>
                                </div>

                                <div className="sa-card sa-card--desc">
                                    <div className="sa-card-title">{t("storageAreas.list.description")}</div>
                                    <p className="sa-desc">{selected.description || "-"}</p>
                                </div>

                                <div className="sa-card sa-card--resources">
                                    <div className="sa-card-title">{t("storageAreas.list.physical")}</div>
                                    <div className="sa-chips">
                                        {selected.physicalResources.length === 0 ? (
                                            <span className="sa-empty">–</span>
                                        ) : (
                                            selected.physicalResources.map((r) => (
                                                <span className="sa-chip" key={r}>{r}</span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="sa-card sa-card--button">
                                    <div className="sa-card-title">{t("storageAreas.list.docks")}</div>
                                    <button
                                        className="sa-btn sa-btn-primary sa-btn-full"
                                        onClick={() => setIsDistancesOpen(true)}
                                    >
                                        {t("storageAreas.list.viewDistances")}
                                    </button>
                                </div>
                            </section>

                            {/* Occupancy Map */}
                            <section className="sa-visual">
                                <div className="sa-visual-header">
                                    <h2>{t("storageAreas.list.tiersMap")}</h2>
                                    <span className="sa-note">{t("storageAreas.list.tiersNote")}</span>
                                </div>

                                <div className="sa-slices-grid">
                                    {slices.map((grid, t) => (
                                        <div className="sa-slice" key={`tier-${t}`}>
                                            <div className="sa-slice-head">
                                                <span className="sa-tag">Tier {t + 1}</span>
                                            </div>
                                            <div className="sa-grid-wrap">
                                                <div
                                                    className="sa-grid fit"
                                                    style={{
                                                        ["--cols" as any]: String(selected.maxBays),
                                                        ["--gap" as any]: "4px"
                                                    }}
                                                >
                                                    {grid.map((row, r) =>
                                                        row.map((cell, b) => (
                                                            <div
                                                                key={`c-${t}-${r}-${b}`}
                                                                className={classNames("sa-cell", cell && "filled")}
                                                            />
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* DISTANCES MODAL */}
            {isDistancesOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setIsDistancesOpen(false)}>
                    <div className="sa-dock-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <div className="sa-dock-spacer" />
                            <h3 className="sa-dock-title">
                                {t("storageAreas.list.distancesTitle", { name: selected.name })}
                            </h3>
                            <button
                                className="sa-icon-btn sa-dock-close"
                                onClick={() => setIsDistancesOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {selected.distancesToDocks.length === 0 ? (
                            <div className="sa-empty" style={{ padding: 12 }}>
                                {t("storageAreas.list.noDistances")}
                            </div>
                        ) : (
                            <div className="sa-dock-body">
                                {(() => {
                                    const max = Math.max(...selected.distancesToDocks.map((d) => d.distance || 0), 1);
                                    return selected.distancesToDocks.map((d, i) => {
                                        const pct = Math.max(8, Math.round(((d.distance || 0) / max) * 100));
                                        return (
                                            <div
                                                className="sa-dock-row"
                                                key={d.dockCode}
                                                style={{ ["--delay" as any]: `${i * 60}ms` }}
                                            >
                                                <div className="sa-dock-label">{d.dockCode}</div>
                                                <div className="sa-dock-bar">
                                                    <div className="sa-dock-fill" style={{ width: `${pct}%` }}>
                                                        <span className="sa-dock-value">{d.distance}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
