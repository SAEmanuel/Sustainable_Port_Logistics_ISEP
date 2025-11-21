import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import storageAreaService from "../service/storageAreaService";
import type {
    CreatingStorageArea,
    StorageAreaDockDistance,
} from "../domain/storageArea";
import { toCreatingStorageAreaDto } from "../mappers/storageAreaMapper";

import { StorageAreaCreateHeader } from "../components/StorageAreaCreateHeader";
import { StorageAreaGeneralSection } from "../components/StorageAreaGeneralSection";
import { StorageAreaResourcesSection } from "../components/StorageAreaResourcesSection";

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
    const { t } = useTranslation();
    const nav = useNavigate();

    const [form, setForm] = useState<CreatingStorageArea>(emptyCreating());
    const [newRes, setNewRes] = useState("");
    const [newDock, setNewDock] = useState("");
    const [newDist, setNewDist] = useState<number | "">("");

    const setField = (k: keyof CreatingStorageArea, v: any) =>
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
            physicalResources: [...f.physicalResources, v],
        }));

        setNewRes("");
    };

    const remRes = (v: string) =>
        setForm(f => ({
            ...f,
            physicalResources: f.physicalResources.filter(x => x !== v),
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
            distancesToDocks: [...f.distancesToDocks, entry],
        }));
        setNewDock("");
        setNewDist("");
    };

    const remDock = (code: string) =>
        setForm(f => ({
            ...f,
            distancesToDocks: f.distancesToDocks.filter(
                d => d.dockCode !== code
            ),
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
                await new Promise(res =>
                    setTimeout(res, MIN_LOADING_TIME - elapsed)
                );
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

        const dto = toCreatingStorageAreaDto(form);

        const created = await runWithLoading(
            storageAreaService.createStorageArea(dto),
            t("storageAreas.create.toast.creatingStorageArea")
        ).catch(() => null);

        if (!created) return;

        toast.success(t("storageAreas.create.btnCreate"));
        nav("/storage-areas");
    };

    return (
        <div className="sa-create-page">
            {/* Header */}
            <StorageAreaCreateHeader onBack={() => nav(-1)} />

            <form onSubmit={submit} className="sa-create-body">
                {/* COLUMN 1 */}
                <StorageAreaGeneralSection form={form} setField={setField} />

                {/* COLUMN 2 */}
                <StorageAreaResourcesSection
                    form={form}
                    newRes={newRes}
                    setNewRes={setNewRes}
                    addRes={addRes}
                    remRes={remRes}
                    newDock={newDock}
                    setNewDock={setNewDock}
                    newDist={newDist}
                    setNewDist={setNewDist}
                    addDock={addDock}
                    remDock={remDock}
                />
            </form>

            <div className="sa-create-actions">
                <button
                    className="sa-btn sa-btn-cancel"
                    onClick={() => nav(-1)}
                >
                    {t("storageAreas.create.btnCancel")}
                </button>
                <button
                    type="submit"
                    className="sa-btn sa-btn-save"
                    onClick={e => submit(e)}
                >
                    {t("storageAreas.create.btnCreate")}
                </button>
            </div>
        </div>
    );
}
