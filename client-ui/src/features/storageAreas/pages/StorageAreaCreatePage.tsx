import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as storageAreaService from "../service/storageAreaService";
import type {
    CreatingStorageArea,
    StorageAreaDockDistance,
    StorageAreaType,
} from "../type/storageAreaType";
import "../style/storageAreaCreate.css";

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

export default function StorageAreaCreatePage() {
    const nav = useNavigate();
    const [form, setForm] = useState<CreatingStorageArea>(emptyCreating());
    const [newRes, setNewRes] = useState("");
    const [newDock, setNewDock] = useState("");
    const [newDist, setNewDist] = useState<string>("");

    const setNum = <K extends keyof CreatingStorageArea>(k: K, v: number) =>
        setForm(f => ({ ...f, [k]: Number.isFinite(v) ? v : (f[k] as any) }));

    const addRes = () => {
        const v = newRes.trim();
        if (!v) return;
        if (form.physicalResources.includes(v))
            return toast.error("Recurso já existe");

        setForm(f => ({ ...f, physicalResources: [...f.physicalResources, v] }));
        setNewRes("");
    };

    const remRes = (v: string) =>
        setForm(f => ({
            ...f,
            physicalResources: f.physicalResources.filter(x => x !== v)
        }));

    const addDock = () => {
        const code = newDock.trim().toUpperCase();
        if (!code) return toast.error("Indica o código do Dock (ex.: D01)");

        const parsedDist = newDist === "" ? 0 : Number(newDist);
        if (parsedDist < 0) return toast.error("Distância inválida");
        if (form.distancesToDocks.some(d => d.dockCode === code))
            return toast.error("Esse Dock já foi adicionado");

        const entry: StorageAreaDockDistance = {
            dockCode: code,
            distance: parsedDist,
        };

        setForm(f => ({ ...f, distancesToDocks: [...f.distancesToDocks, entry] }));
        setNewDock("");
        setNewDist("");
    };

    const remDock = (code: string) =>
        setForm(f => ({
            ...f,
            distancesToDocks: f.distancesToDocks.filter(d => d.dockCode !== code)
        }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Nome obrigatório");

        if (!["Yard", "Warehouse"].includes(form.type))
            return toast.error("Tipo inválido (Yard ou Warehouse)");

        if (form.maxBays < 1 || form.maxRows < 1 || form.maxTiers < 1)
            return toast.error("Bays/Rows/Tiers devem ser ≥ 1");

        if (form.distancesToDocks.length === 0)
            return toast.error("Adiciona pelo menos uma distância a Dock");

        try {
            const created = await storageAreaService.createStorageArea(form);
            toast.success(`Criado: ${created.name}`);
            nav("/storage-areas");
        } catch (err: any) {
            toast.error(err?.response?.data ?? "Erro ao criar Storage Area");
        }
    };

    return (
        <form className="sa-create-page" onSubmit={submit}>

            <div className="sa-create-header">
                <h2 className="sa-create-title">➕ Nova Storage Area</h2>
            </div>

            <div className="sa-create-body">

                {/* COLUNA 1 */}
                <div className="sa-section">
                    <div className="sa-section-title">Informação Geral</div>

                    <div className="sa-field">
                        <label>Nome *</label>
                        <input
                            className="sa-input"
                            placeholder="Ex.: Yard A1"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>

                    <div className="sa-field">
                        <label>Descrição</label>
                        <textarea
                            className="sa-textarea"
                            placeholder="Notas / observações"
                            value={form.description ?? ""}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className="sa-field">
                        <label>Tipo *</label>
                        <select
                            className="sa-select"
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value as StorageAreaType }))}
                        >
                            <option value="Yard">Yard</option>
                            <option value="Warehouse">Warehouse</option>
                        </select>
                    </div>

                    <div className="sa-grid-3">
                        <div className="sa-field">
                            <label>Bays *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxBays}
                                onChange={e => setNum("maxBays", Number(e.target.value))}
                            />
                        </div>

                        <div className="sa-field">
                            <label>Rows *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxRows}
                                onChange={e => setNum("maxRows", Number(e.target.value))}
                            />
                        </div>

                        <div className="sa-field">
                            <label>Tiers *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxTiers}
                                onChange={e => setNum("maxTiers", Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* COLUNA 2 */}
                <div className="sa-section">
                    <div className="sa-section-title">Recursos & Docks</div>

                    {/* Recursos */}
                    <div className="sa-field">
                        <label>Adicionar Recurso</label>
                        <div className="sa-inline">
                            <input
                                className="sa-input"
                                placeholder="Ex.: RTG-01"
                                value={newRes}
                                onChange={e => setNewRes(e.target.value)}
                            />
                            <button type="button" className="sa-chip-btn" onClick={addRes}>+</button>
                        </div>
                    </div>

                    <div className="sa-box">
                        {form.physicalResources.length ? (
                            form.physicalResources.map(r => (
                                <span key={r} className="sa-chip" onClick={() => remRes(r)}>{r} ✕</span>
                            ))
                        ) : (
                            "Nenhum recurso adicionado"
                        )}
                    </div>

                    {/* Docks */}
                    <div className="sa-field" style={{ marginTop: "14px" }}>
                        <label>Dock + Distância *</label>
                        <div className="sa-inline">
                            <input
                                className="sa-input"
                                placeholder="D01"
                                value={newDock}
                                onChange={e => setNewDock(e.target.value)}
                            />
                            <input
                                className="sa-input"
                                type="number"
                                placeholder="Distância"
                                value={newDist}
                                onChange={e => setNewDist(e.target.value)}
                            />
                            <button type="button" className="sa-chip-btn" onClick={addDock}>+</button>
                        </div>
                    </div>

                    <div className="sa-box">
                        {form.distancesToDocks.length ? (
                            form.distancesToDocks.map(d => (
                                <span key={d.dockCode} className="sa-chip" onClick={() => remDock(d.dockCode)}>
                                    {d.dockCode} → {d.distance}m ✕
                                </span>
                            ))
                        ) : (
                            "Nenhuma distância adicionada"
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER FIXO */}
            <div className="sa-create-actions">
                <button
                    type="button"
                    className="sa-btn sa-btn-cancel"
                    onClick={() => nav("/storage-areas")}
                >
                    Cancelar
                </button>
                <button type="submit" className="sa-btn sa-btn-save">
                    Criar Storage Area
                </button>
            </div>
        </form>
    );
}
