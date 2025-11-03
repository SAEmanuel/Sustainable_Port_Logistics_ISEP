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
    StorageAreaGridDto,
} from "../type/storageAreaType";

// utils
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
const GUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export default function StorageAreaPage() {
    const [items, setItems] = useState<StorageAreaDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<StorageAreaDto | null>(null);

    // 👇 NOVO: grid real do selecionado
    const [grid, setGrid] = useState<StorageAreaGridDto | null>(null);
    const [loadingGrid, setLoadingGrid] = useState(false);

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState<CreatingStorageArea>(emptyCreating());
    const [newResource, setNewResource] = useState("");
    const [newDockCode, setNewDockCode] = useState("");
    const [newDockDistance, setNewDockDistance] = useState<number>(0);

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

    // ▶ sempre que muda o selecionado, carrega o GRID real
    useEffect(() => {
        (async () => {
            if (!selected) {
                setGrid(null);
                return;
            }
            try {
                setLoadingGrid(true);
                const g = await storageAreaService.getStorageAreaGrid(selected.id);
                setGrid(g);
            } catch (e: any) {
                setGrid(null);
                toast.error(e?.response?.data ?? "Erro a carregar o mapa real de posições.");
            } finally {
                setLoadingGrid(false);
            }
        })();
    }, [selected?.id]);

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

    // Mapa rápido para lookup de slot ocupado -> ISO
    const occupiedKeyToIso = useMemo(() => {
        const map = new Map<string, string>();
        if (grid?.slots) {
            for (const s of grid.slots) {
                if (s.iso) {
                    map.set(`${s.tier}-${s.row}-${s.bay}`, s.iso);
                }
            }
        }
        return map;
    }, [grid]);

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
        if (form.physicalResources.includes(v)) {
            toast("Recurso já existe");
            return;
        }
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
            <header className="sa-header">
                <div className="sa-title">
                    <FaShip />
                    <h1>Storage Areas</h1>
                </div>

                <div className="sa-actions">
                    <div className="sa-search">
                        <FaSearch />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquisar por nome, tipo, recurso ou GUID…"
                        />
                    </div>

                    <button className="sa-btn sa-btn-primary" onClick={openCreate}>
                        <FaPlus />
                        <span>Nova</span>
                    </button>
                </div>
            </header>

            <div className="sa-content">
                <aside className="sa-list">
                    {loading ? (
                        <div className="sa-skeleton-list">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div className="sa-skeleton-item" key={i} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="sa-empty">Sem resultados.</div>
                    ) : (
                        filtered.map((x) => {
                            const active = selected?.id === x.id;
                            return (
                                <button
                                    key={x.id}
                                    className={classNames("sa-list-item", active && "active")}
                                    onClick={() => setSelected(x)}
                                >
                                    <div className="sa-list-name">{x.name}</div>
                                    <div className="sa-list-meta">
                    <span className={classNames("sa-badge", x.type === "Yard" ? "yard" : "warehouse")}>
                      {x.type}
                    </span>
                                        <span className="sa-small">
                      {x.currentCapacityTeu}/{x.maxCapacityTeu} TEU
                    </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </aside>

                <main className="sa-main">
                    {!selected ? (
                        <div className="sa-empty">Seleciona uma Storage Area…</div>
                    ) : (
                        <>
                            <section className="sa-kpis">
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
                                    <div className="sa-progress-label">
                                        {formatPct(selected.currentCapacityTeu, selected.maxCapacityTeu)}
                                    </div>
                                </div>
                                <div className="sa-card sa-donut">
                                    <svg viewBox="0 0 36 36" className="sa-donut-svg">
                                        <path
                                            className="sa-donut-bg"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="sa-donut-fg"
                                            strokeDasharray={`${capacityPct}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <text x="18" y="20.35" className="sa-donut-text">
                                            {capacityPct}%
                                        </text>
                                    </svg>
                                    <div className="sa-card-sub">Ocupação</div>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">Dimensões</div>
                                    <div className="sa-card-value">
                                        {selected.maxBays} Bays · {selected.maxRows} Rows · {selected.maxTiers} Tiers
                                    </div>
                                </div>
                            </section>

                            {/* Visualização REAL por tiers */}
                            <section className="sa-visual">
                                <div className="sa-visual-header">
                                    <h2>Mapa de Ocupação (real)</h2>
                                    <span className="sa-note">
                    Mostra slots ocupados de acordo com o grid armazenado ({selected.name}).
                  </span>
                                </div>

                                {loadingGrid ? (
                                    <div className="sa-skeleton-list">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div className="sa-skeleton-item" key={i} style={{ height: 90 }} />
                                        ))}
                                    </div>
                                ) : !grid ? (
                                    <div className="sa-empty">Sem dados de grid.</div>
                                ) : (
                                    <div className="sa-slices">
                                        {Array.from({ length: grid.maxTiers }).map((_, t) => (
                                            <div className="sa-slice" key={`tier-${t}`}>
                                                <div className="sa-slice-head">
                                                    <span className="sa-tag">Tier {t + 1}</span>
                                                </div>
                                                <div
                                                    className="sa-grid"
                                                    style={{
                                                        gridTemplateColumns: `repeat(${grid.maxBays}, minmax(14px, 1fr))`,
                                                        gridTemplateRows: `repeat(${grid.maxRows}, 14px)`,
                                                    }}
                                                >
                                                    {Array.from({ length: grid.maxRows }).map((_, r) =>
                                                        Array.from({ length: grid.maxBays }).map((_, b) => {
                                                            const key = `${t}-${r}-${b}`;
                                                            const iso = occupiedKeyToIso.get(key);
                                                            const filled = Boolean(iso);
                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className={classNames("sa-cell", filled && "filled")}
                                                                    title={
                                                                        filled
                                                                            ? `Tier ${t + 1} • Row ${r + 1} • Bay ${b + 1}\nISO: ${iso}`
                                                                            : `Tier ${t + 1} • Row ${r + 1} • Bay ${b + 1} — livre`
                                                                    }
                                                                />
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Recursos + Distâncias + Descrição */}
                            <section className="sa-details">
                                <div className="sa-card">
                                    <div className="sa-card-title">Descrição</div>
                                    <p className="sa-desc">{selected.description || "Sem descrição."}</p>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">Recursos Físicos</div>
                                    <div className="sa-chips">
                                        {selected.physicalResources.length === 0 ? (
                                            <span className="sa-empty">–</span>
                                        ) : (
                                            selected.physicalResources.map((r) => (
                                                <span className="sa-chip" key={r}>
                          {r}
                        </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="sa-card">
                                    <div className="sa-card-title">Distâncias aos Docks</div>
                                    {selected.distancesToDocks.length === 0 ? (
                                        <div className="sa-empty">Sem distâncias registadas.</div>
                                    ) : (
                                        <table className="sa-table">
                                            <thead>
                                            <tr>
                                                <th>Dock</th>
                                                <th>Distância</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selected.distancesToDocks.map((d) => (
                                                <tr key={d.dockCode}>
                                                    <td>{d.dockCode}</td>
                                                    <td>{d.distance}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* Modal de criação */}
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
