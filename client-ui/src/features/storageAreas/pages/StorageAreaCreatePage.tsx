import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import * as storageAreaService from "../service/storageAreaService";
import type {CreatingStorageArea, StorageAreaDockDistance
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
        distancesToDocks: []
    };
}

export default function StorageAreaCreatePage() {
    const { t } = useTranslation();
    const nav = useNavigate();

    const [form, setForm] = useState<CreatingStorageArea>(emptyCreating());
    const [newRes, setNewRes] = useState("");
    const [newDock, setNewDock] = useState("");
    const [newDist, setNewDist] = useState<number | "">("");

    const setField = <K extends keyof CreatingStorageArea>(k: K, v: any) =>
        setForm(f => ({ ...f, [k]: v }));

    const addRes = () => {
        const v = newRes.trim();
        if (!v) return;

        if (form.physicalResources.includes(v)) {
            toast.error(t("storageAreas.create.toast.nameRequired"));
            return;
        }

        setForm(f => ({
            ...f,
            physicalResources: [...f.physicalResources, v]
        }));

        setNewRes("");
    };

    const remRes = (v: string) =>
        setForm(f => ({
            ...f,
            physicalResources: f.physicalResources.filter(x => x !== v)
        }));

    const addDock = () => {
        const code = newDock.trim().toUpperCase();
        if (!code) return;

        const dist = newDist === "" ? 0 : Number(newDist);
        if (dist < 0) {
            toast.error(t("storageAreas.create.toast.invalidDistance"));
            return;
        }

        if (form.distancesToDocks.some(d => d.dockCode === code)) {
            toast.error("Dock already exists");
            return;
        }

        const entry: StorageAreaDockDistance = { dockCode: code, distance: dist };
        setForm(f => ({
            ...f,
            distancesToDocks: [...f.distancesToDocks, entry]
        }));

        setNewDock("");
        setNewDist("");
    };

    const remDock = (code: string) =>
        setForm(f => ({
            ...f,
            distancesToDocks: f.distancesToDocks.filter(d => d.dockCode !== code)
        }));
    
    const MIN_LOADING_TIME = 500;

    async function runWithLoading<T>(promise: Promise<T>, text: string) {
        const id = toast.loading(text);
        const start = Date.now();
        try {
            return await promise;
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < MIN_LOADING_TIME)
                await new Promise(res => setTimeout(res, MIN_LOADING_TIME - elapsed));
            toast.dismiss(id);
        }
    }
    
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error(t("storageAreas.create.toast.nameRequired"));
            return;
        }

        if (form.distancesToDocks.length === 0) {
            toast.error(t("storageAreas.create.toast.distanceRequired"));
            return;
        }

        const created = await runWithLoading(storageAreaService.createStorageArea(form),"Creating Storage Area").catch(() => null);
       
        if (!created) return;
        
        toast.success(t("storageAreas.create.btnCreate"));
        nav("/storage-areas");
    };

    
    
    return (
        <div className="sa-create-page">
            {/* Header */}
            <div className="sa-create-header">
                <h2 className="sa-create-title">
                    ➕ {t("storageAreas.create.title")}
                </h2>
                <button className="sa-btn sa-btn-cancel" onClick={() => nav(-1)}>
                    ← {t("storageAreas.create.btnBack")}
                </button>
            </div>

            <form onSubmit={submit} className="sa-create-body">

                {/* COLUMN 1 */}
                <div className="sa-section">
                    <div className="sa-section-title">
                        {t("storageAreas.create.generalInfo")}
                    </div>

                    <div className="sa-field">
                        <label>{t("storageAreas.create.name")} *</label>
                        <input
                            className="sa-input"
                            placeholder={t("storageAreas.create.name_PH")}
                            value={form.name ?? ""}
                            onChange={e => setField("name", e.target.value)}
                        />
                    </div>

                    <div className="sa-field">
                        <label>{t("storageAreas.create.description")}</label>
                        <textarea
                            className="sa-textarea"
                            placeholder={t("storageAreas.create.description_PH")}
                            value={form.description ?? ""}
                            onChange={e => setField("description", e.target.value)}
                        />
                    </div>

                    <div className="sa-field">
                        <label>{t("storageAreas.create.type")} *</label>
                        <select
                            className="sa-select"
                            value={form.type ?? "Yard"}
                            onChange={e => setField("type", e.target.value)}
                        >
                            <option value="Yard">{t("storageAreas.create.yard")}</option>
                            <option value="Warehouse">{t("storageAreas.create.warehouse")}</option>
                        </select>
                    </div>

                    <div className="sa-grid-3">
                        <div className="sa-field">
                            <label>{t("storageAreas.create.bays")} *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxBays ?? 1}
                                onChange={e => setField("maxBays", Number(e.target.value))}
                            />
                        </div>

                        <div className="sa-field">
                            <label>{t("storageAreas.create.rows")} *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxRows ?? 1}
                                onChange={e => setField("maxRows", Number(e.target.value))}
                            />
                        </div>

                        <div className="sa-field">
                            <label>{t("storageAreas.create.tiers")} *</label>
                            <input
                                className="sa-input"
                                type="number"
                                min={1}
                                value={form.maxTiers ?? 1}
                                onChange={e => setField("maxTiers", Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* COLUMN 2 */}
                <div className="sa-section">
                    <div className="sa-section-title">
                        {t("storageAreas.create.resourcesDocks")}
                    </div>

                    <div className="sa-field">
                        <label>{t("storageAreas.create.addResource")}</label>
                        <div className="sa-inline">
                            <input
                                className="sa-input"
                                placeholder={t("storageAreas.create.resource_PH")}
                                value={newRes ?? ""}
                                onChange={e => setNewRes(e.target.value)}
                            />
                            <button type="button" className="sa-chip-btn" onClick={addRes}>+</button>
                        </div>
                    </div>

                    <div className="sa-box">
                        {form.physicalResources.length === 0
                            ? t("storageAreas.create.noResources")
                            : form.physicalResources.map(r => (
                                <span key={r} className="sa-chip" onClick={() => remRes(r)}>
                    {r} ✕
                  </span>
                            ))}
                    </div>

                    <div className="sa-field">
                        <label>{t("storageAreas.create.dockDistance")} *</label>

                        <input
                            className="sa-input"
                            placeholder={t("storageAreas.create.dock_PH")}
                            value={newDock ?? ""}
                            onChange={e => setNewDock(e.target.value)}
                        />

                        <input
                            className="sa-input"
                            type="number"
                            min={0}
                            placeholder={t("storageAreas.create.distance_PH")}
                            value={newDist === "" ? "" : String(newDist)}
                            onChange={e =>
                                setNewDist(e.target.value === "" ? "" : Number(e.target.value))
                            }
                        />

                        <button type="button" className="sa-chip-btn" onClick={addDock}>+</button>
                    </div>

                    <div className="sa-box">
                        {form.distancesToDocks.length === 0
                            ? t("storageAreas.create.noDistance")
                            : form.distancesToDocks.map(d => (
                                <span key={d.dockCode} className="sa-chip" onClick={() => remDock(d.dockCode)}>
                    {d.dockCode}: {d.distance}m ✕
                  </span>
                            ))}
                    </div>
                </div>
            </form>

            <div className="sa-create-actions">
                <button className="sa-btn sa-btn-cancel" onClick={() => nav(-1)}>
                    {t("storageAreas.create.btnCancel")}
                </button>
                <button type="submit" className="sa-btn sa-btn-save" onClick={(e) => submit(e)}>
                    {t("storageAreas.create.btnCreate")}
                </button>
            </div>
        </div>
    );
}
