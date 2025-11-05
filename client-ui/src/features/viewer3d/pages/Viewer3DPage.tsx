// src/features/viewer3d/pages/Viewer3DPage.tsx
import { useEffect, useMemo, useState } from "react";
import ThreeScene from "../components/ThreeScene";
import { loadSceneData } from "../services/viewer3dService";
import type { SceneData } from "../types";
import "../style/viewer3d.css";

type Layers = { docks: boolean; storage: boolean; vessels: boolean; containers: boolean; resources: boolean };

export default function Viewer3DPage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<SceneData>({ docks: [], storageAreas: [], vessels: [], containers: [], resources: [] });
    const [layers, setLayers] = useState<Layers>({ docks: true, storage: true, vessels: true, containers: false, resources: true });
    const [picked, setPicked] = useState<{ type: string; id: string; label: string } | null>(null);

    const canShow = useMemo(() => !loading && !err, [loading, err]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        loadSceneData()
            .then((d) => { if (alive) { setData(d); setErr(null); } })
            .catch((e) => { if (alive) setErr(e?.message ?? "Failed to load 3D data."); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const toggle = (k: keyof Layers) => setLayers((s) => ({ ...s, [k]: !s[k] }));

    return (
        <div className="viewer3d-wrapper">
            <div className="viewer3d-header">
                <h2>3D Port Viewer</h2>
                <div className="viewer3d-actions">
                    <button className={`chip ${layers.docks ? "on" : ""}`} onClick={() => toggle("docks")}>Docks</button>
                    <button className={`chip ${layers.storage ? "on" : ""}`} onClick={() => toggle("storage")}>Storage</button>
                    <button className={`chip ${layers.vessels ? "on" : ""}`} onClick={() => toggle("vessels")}>Vessels</button>
                    <button className={`chip ${layers.containers ? "on" : ""}`} onClick={() => toggle("containers")}>Containers</button>
                    <button className={`chip ${layers.resources ? "on" : ""}`} onClick={() => toggle("resources")}>Resources</button>
                </div>
            </div>

            {loading && <div className="viewer3d-fallback">Loading 3D…</div>}
            {err && <div className="viewer3d-error">⚠ {err}</div>}

            {canShow && (
                <div className="viewer3d-stage">
                    <ThreeScene data={data} visible={layers} onPick={setPicked} />
                    <aside className="viewer3d-side">
                        <h3>Scene Info</h3>
                        <ul>
                            <li>Docks: {data.docks.length}</li>
                            <li>Storage Areas: {data.storageAreas.length}</li>
                            <li>Vessels: {data.vessels.length}</li>
                            <li>Containers: {data.containers.length}</li>
                            <li>Resources: {data.resources.length}</li>
                        </ul>

                        <div className="viewer3d-picked">
                            <h4>Selection</h4>
                            {picked ? (
                                <div className="picked-card">
                                    <div className="k">Type</div><div className="v">{picked.type}</div>
                                    <div className="k">Label</div><div className="v">{picked.label}</div>
                                    <div className="k">Id</div><div className="v small">{picked.id}</div>
                                </div>
                            ) : <p>Click an object in the scene.</p>}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
