import { useEffect, useMemo, useState } from "react";
import { FaShip, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import "../style/storageAreaStyle.css";
import * as storageAreaService from "../service/storageAreaService";
import type {
    StorageAreaDto,
    CreatingStorageArea,
    StorageAreaDockDistance,
    StorageAreaType,
} from "../type/storageAreaType";

/* Helpers */
function formatPct(num: number, den: number) {
    if (!den) return "0%";
    return `${Math.round((num / den) * 100)}%`;
}
function classNames(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}
function emptyCreating(): CreatingStorageArea {
    return {
        name: "",
        description: "",
        type: "Yard",
        maxBays: 1,
        maxRows: 1,
        maxTiers: 1,
        physicalResources: [],
        distancesToDocks: [],
    };
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
const GUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export default function StorageAreaPage() {
    /* State */
    const [items, setItems] = useState<StorageAreaDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<StorageAreaDto | null>(null);

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState<CreatingStorageArea>(emptyCreating());
    const [newResource, setNewResource] = useState("");
    const [newDockCode, setNewDockCode] = useState("");
    const [newDockDistance, setNewDockDistance] = useState<number>(0);

    // Distances modal
    const [isDistancesOpen, setIsDistancesOpen] = useState(false);

    /* Effects */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await storageAreaService.getAllStorageAreas();
                setItems(data);
                if (data.length) setSelected(data[0]);
                toast.success(`Carregadas ${data.length} storage areas.`);
            } catch (e: any) {
                toast.error(e?.response?.data ?? "Erro a carregar storage areas.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
    function openCreate() {
        setForm(emptyCreating());
        setNewResource("");
        setNewDockCode("");
        setNewDockDistance(0);
        setIsCreateOpen(true);
    }
    function addResource() {
        const v = newResource.trim();
        if (!v) return;
        if (form.physicalResources.includes(v)) return toast("Recurso já existe");
        setForm((f) => ({ ...f, physicalResources: [...f.physicalResources, v] }));
        setNewResource("");
    }
    function removeResource(code: string) {
        setForm((f) => ({
            ...f,
            physicalResources: f.physicalResources.filter((x) => x !== code),
        }));
    }
    function addDistance() {
        const code = newDockCode.trim().toUpperCase();
        if (!code) return toast("Dock code em falta");
        if (form.distancesToDocks.some((d) => d.dockCode === code)) {
            return toast("Já adicionaste esse dock");
        }
        if (newDockDistance < 0) return toast("Distância inválida");
        const entry: StorageAreaDockDistance = { dockCode: code, distance: newDockDistance };
        setForm((f) => ({ ...f, distancesToDocks: [...f.distancesToDocks, entry] }));
        setNewDockCode("");
        setNewDockDistance(0);
    }
    function removeDistance(code: string) {
        setForm((f) => ({
            ...f,
            distancesToDocks: f.distancesToDocks.filter((d) => d.dockCode !== code),
        }));
    }
    function updateNumber<K extends keyof CreatingStorageArea>(key: K, v: number) {
        setForm((f) => ({ ...f, [key]: Number.isFinite(v) ? v : (f[key] as any) }));
    }
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Nome obrigatório");
        if (form.maxBays < 1 || form.maxRows < 1 || form.maxTiers < 1) {
            return toast.error("Bays/Rows/Tiers devem ser ≥ 1");
        }
        if (!["Yard", "Warehouse"].includes(form.type)) {
            return toast.error("Tipo inválido (Yard ou Warehouse)");
        }
        if (form.distancesToDocks.length === 0) {
            return toast.error("Adiciona pelo menos uma distância a dock");
        }
        try {
            const created = await storageAreaService.createStorageArea(form);
            toast.success(`Criado: ${created.name}`);
            setItems((prev) => [created, ...prev]);
            setSelected(created);
            setIsCreateOpen(false);
        } catch (e: any) {
            toast.error(e?.response?.data ?? "Erro ao criar Storage Area");
        }
    }

    return (
        <div className="sa-wrapper">
            {/* HEADER */}
            <div className="vt-title-area" style={{ marginBottom: "20px" }}>
                <div>
                    <h2 className="vt-title">
                        <FaShip /> Storage Areas
                    </h2>
                    <p className="vt-sub">{filtered.length} áreas registadas</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <div className="sa-search" style={{ background: "var(--card-bg)", padding: "6px 10px" }}>
                        <FaSearch style={{ opacity: 0.7 }} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquisar…"
                            style={{
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                paddingLeft: "6px",
                                width: "140px",
                                color: "var(--text)",
                            }}
                        />
                    </div>

                    <button className="vt-create-btn-top" onClick={openCreate}>
                        <FaPlus /> Nova
                    </button>
                </div>
            </div>

            {/* LISTA HORIZONTAL + MAIN ABAIXO */}
            <div className="sa-content-vertical">
                {/* Lista horizontal (scroll-snap) */}
                <div className="sa-strip">
                    <div className="sa-strip-inner">
                        {loading ? (
                            <>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div className="sa-strip-skeleton" key={i} />
                                ))}
                            </>
                        ) : filtered.length === 0 ? (
                            <div className="sa-empty" style={{ padding: 10 }}>Sem resultados.</div>
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

                {/* Painel principal (igual) */}
                <main className="sa-main">
                    {!selected ? (
                        <div className="sa-empty">Seleciona uma Storage Area…</div>
                    ) : (
                        <>
                            {/* KPI GRID — inclui Descrição e Recursos */}
                            <section className="sa-kpis sa-kpis--extended">
                                <div className="sa-card">
                                    <div className="sa-card-title">Tipo</div>
                                    <div className="sa-card-value">{selected.type}</div>
                                </div>

                                <div className="sa-card">
                                    <div className="sa-card-title">Capacidade</div>
                                    <div className="sa-card-value">
                                        {selected.currentCapacityTeu}/{selected.maxCapacityTeu} TEU
                                    </div>
                                    <div className="sa-progress">
                                        <div className="sa-progress-fill" style={{ width: `${capacityPct}%` }} />
                                    </div>
                                    <div className="sa-progress-label">{formatPct(selected.currentCapacityTeu, selected.maxCapacityTeu)}</div>
                                </div>

                                <div className="sa-card">
                                    <div className="sa-card-title">Dimensões</div>
                                    <div className="sa-card-value">
                                        {selected.maxBays} Bays · {selected.maxRows} Rows · {selected.maxTiers} Tiers
                                    </div>
                                </div>

                                <div className="sa-card sa-card--desc">
                                    <div className="sa-card-title">Descrição</div>
                                    <p className="sa-desc">{selected.description || "Sem descrição."}</p>
                                </div>

                                <div className="sa-card sa-card--resources">
                                    <div className="sa-card-title">Recursos Físicos</div>
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
                                    <div className="sa-card-title">Docks</div>
                                    <button className="sa-btn sa-btn-primary sa-btn-full" onClick={() => setIsDistancesOpen(true)}>
                                        Ver distâncias
                                    </button>
                                </div>
                            </section>

                            {/* Visualização tiers (inalterado) */}
                            <section className="sa-visual">
                                <div className="sa-visual-header">
                                    <h2>Mapa de Ocupação (aproximação)</h2>
                                    <span className="sa-note">
                    Render sequencial (bay→row→tier) com base na capacidade atual — não representa posições reais.
                  </span>
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
                                                    style={
                                                        {
                                                            "--cols": String(selected.maxBays),
                                                            "--gap": "4px",
                                                        } as React.CSSProperties
                                                    }
                                                >
                                                    {grid.map((row, r) =>
                                                        row.map((cell, b) => (
                                                            <div
                                                                key={`c-${t}-${r}-${b}`}
                                                                className={classNames("sa-cell", cell && "filled")}
                                                                title={`Tier ${t + 1} • Row ${r + 1} • Bay ${b + 1} — ${cell ? "ocupado" : "livre"}`}
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

            {/* POPUP Distâncias */}
            {isDistancesOpen && selected && (
                <div className="sa-modal-backdrop" onClick={() => setIsDistancesOpen(false)}>
                    <div className="sa-dock-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-dock-head">
                            <h3>Distâncias aos Docks — {selected.name}</h3>
                            <button className="sa-icon-btn" onClick={() => setIsDistancesOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {selected.distancesToDocks.length === 0 ? (
                            <div className="sa-empty" style={{ padding: 12 }}>Sem distâncias registadas.</div>
                        ) : (
                            <div className="sa-dock-body">
                                {(() => {
                                    const max = Math.max(...selected.distancesToDocks.map((d) => d.distance || 0), 1);
                                    return selected.distancesToDocks.map((d) => {
                                        const pct = Math.max(8, Math.round(((d.distance || 0) / max) * 100));
                                        return (
                                            <div className="sa-dock-row" key={d.dockCode}>
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

            {/* Modal criar (inalterado) */}
            {isCreateOpen && (
                <div className="sa-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
                    <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-modal-head">
                            <h3>
                                <FaPlus /> Nova Storage Area
                            </h3>
                            <button className="sa-icon-btn" onClick={() => setIsCreateOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <form className="sa-form" onSubmit={handleCreate}>
                            <div className="sa-form-row">
                                <label>Nome *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Ex.: Yard A1"
                                    required
                                />
                            </div>

                            <div className="sa-form-row">
                                <label>Descrição</label>
                                <textarea
                                    value={form.description ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Notas / observações"
                                    maxLength={100}
                                />
                            </div>

                            <div className="sa-form-row">
                                <label>Tipo *</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as StorageAreaType }))}
                                >
                                    <option value="Yard">Yard</option>
                                    <option value="Warehouse">Warehouse</option>
                                </select>
                            </div>

                            <div className="sa-form-grid-3">
                                <div className="sa-form-row">
                                    <label>Max Bays *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.maxBays}
                                        onChange={(e) => updateNumber("maxBays", parseInt(e.target.value, 10))}
                                        required
                                    />
                                </div>
                                <div className="sa-form-row">
                                    <label>Max Rows *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.maxRows}
                                        onChange={(e) => updateNumber("maxRows", parseInt(e.target.value, 10))}
                                        required
                                    />
                                </div>
                                <div className="sa-form-row">
                                    <label>Max Tiers *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.maxTiers}
                                        onChange={(e) => updateNumber("maxTiers", parseInt(e.target.value, 10))}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Recursos */}
                            <div className="sa-form-block">
                                <div className="sa-form-row inline">
                                    <label>Recursos Físicos</label>
                                    <div className="sa-inline-add">
                                        <input
                                            value={newResource}
                                            onChange={(e) => setNewResource(e.target.value)}
                                            placeholder="Código do recurso (ex.: RTG01)"
                                        />
                                        <button type="button" className="sa-btn sa-btn-secondary" onClick={addResource}>
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                                <div className="sa-chips editable">
                                    {form.physicalResources.map((r) => (
                                        <span className="sa-chip removable" key={r} onClick={() => removeResource(r)} title="Remover">
                      {r} <FaTimes />
                    </span>
                                    ))}
                                    {form.physicalResources.length === 0 && <span className="sa-empty">Nenhum recurso</span>}
                                </div>
                            </div>

                            {/* Distâncias */}
                            <div className="sa-form-block">
                                <div className="sa-form-row inline">
                                    <label>Distâncias aos Docks *</label>
                                    <div className="sa-inline-add">
                                        <input
                                            value={newDockCode}
                                            onChange={(e) => setNewDockCode(e.target.value)}
                                            placeholder="Dock code (ex.: D01)"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={Number.isFinite(newDockDistance) ? newDockDistance : 0}
                                            onChange={(e) => setNewDockDistance(parseFloat(e.target.value))}
                                            placeholder="Distância"
                                        />
                                        <button type="button" className="sa-btn sa-btn-secondary" onClick={addDistance}>
                                            Adicionar
                                        </button>
                                    </div>
                                </div>

                                {form.distancesToDocks.length === 0 ? (
                                    <div className="sa-empty">Nenhuma distância adicionada</div>
                                ) : (
                                    <table className="sa-table compact">
                                        <thead>
                                        <tr>
                                            <th>Dock</th>
                                            <th>Distância</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {form.distancesToDocks.map((d) => (
                                            <tr key={d.dockCode}>
                                                <td>{d.dockCode}</td>
                                                <td>{d.distance}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="sa-link danger"
                                                        onClick={() => removeDistance(d.dockCode)}
                                                    >
                                                        remover
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="sa-modal-actions">
                                <button type="button" className="sa-btn" onClick={() => setIsCreateOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="sa-btn sa-btn-primary">
                                    Criar Storage Area
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
