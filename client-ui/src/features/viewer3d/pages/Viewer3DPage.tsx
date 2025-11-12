import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ThreeScene, { type ThreeSceneHandle } from "../components/ThreeScene";
import { loadSceneData } from "../services/viewer3dService";
import type { SceneData } from "../types";
import { useTranslation } from "react-i18next";
import "../style/viewer3d.css";

type Layers = { docks: boolean; storage: boolean; vessels: boolean; containers: boolean; resources: boolean };

export default function Viewer3DPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<SceneData>({ docks: [], storageAreas: [], vessels: [], containers: [], resources: [] });
    const [layers, setLayers] = useState<Layers>({ docks: true, storage: true, vessels: true, containers: true, resources: true });
    const [picked, setPicked] = useState<{ type: string; id: string; label: string } | null>(null);
    const canShow = useMemo(() => !loading && !err, [loading, err]);

    // ===== Fullscreen control =====
    const sceneHandle = useRef<ThreeSceneHandle | null>(null);
    const [isFs, setIsFs] = useState(false);

    const enterFs = useCallback(() => {
        const el = sceneHandle.current?.getHost();
        if (!el) return;
        // @ts-ignore Safari
        (el.requestFullscreen || (el as any).webkitRequestFullscreen)?.call(el, { navigationUI: "hide" });
    }, []);
    const exitFs = useCallback(() => {
        // @ts-ignore Safari
        (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    }, []);
    const toggleFs = useCallback(() => {
        // @ts-ignore Safari
        const current = document.fullscreenElement || (document as any).webkitFullscreenElement;
        const host = sceneHandle.current?.getHost();
        if (current === host) exitFs(); else enterFs();
    }, [enterFs, exitFs]);

    useEffect(() => {
        const onFsChange = () => {
            // @ts-ignore Safari
            const current = document.fullscreenElement || (document as any).webkitFullscreenElement;
            const host = sceneHandle.current?.getHost();
            const active = !!host && current === host;
            setIsFs(active);
            sceneHandle.current?.forceResize();
        };
        document.addEventListener("fullscreenchange", onFsChange);
        // @ts-ignore
        document.addEventListener("webkitfullscreenchange", onFsChange);

        const onKey = (e: KeyboardEvent) => {
            if (e.altKey && e.key === "Enter") {
                e.preventDefault();
                toggleFs();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("fullscreenchange", onFsChange);
            // @ts-ignore
            document.removeEventListener("webkitfullscreenchange", onFsChange);
            window.removeEventListener("keydown", onKey);
        };
    }, [toggleFs]);

    // ===== Fetch =====
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
                <h2>{t("viewer3d.title")}</h2>
                <div className="viewer3d-actions">
                    <button className={`chip ${layers.docks ? "on" : ""}`} onClick={() => toggle("docks")}>
                        {t("viewer3d.toggles.docks")}
                    </button>
                    <button className={`chip ${layers.storage ? "on" : ""}`} onClick={() => toggle("storage")}>
                        {t("viewer3d.toggles.storage")}
                    </button>
                    <button className={`chip ${layers.vessels ? "on" : ""}`} onClick={() => toggle("vessels")}>
                        {t("viewer3d.toggles.vessels")}
                    </button>
                    <button className={`chip ${layers.containers ? "on" : ""}`} onClick={() => toggle("containers")}>
                        {t("viewer3d.toggles.containers")}
                    </button>
                    <button className={`chip ${layers.resources ? "on" : ""}`} onClick={() => toggle("resources")}>
                        {t("viewer3d.toggles.resources")}
                    </button>

                    {/* Fullscreen */}
                    <button className={`chip ${isFs ? "on" : ""}`} onClick={toggleFs} title="Alt+Enter">
                        {isFs ? t("viewer3d.fullscreenExit") : t("viewer3d.fullscreen")}
                    </button>
                    
                </div>
            </div>

            {loading && <div className="viewer3d-fallback">{t("viewer3d.loading")}</div>}
            {err && <div className="viewer3d-error">{t("viewer3d.errorPrefix")} {err}</div>}

            {canShow && (
                <div className="viewer3d-stage">
                    <ThreeScene
                        ref={sceneHandle}
                        data={data}
                        visible={layers as any}
                        onPick={setPicked}
                    />
                    <aside className="viewer3d-side">
                        <h3>{t("viewer3d.sceneInfo")}</h3>
                        <ul>
                            <li>{t("viewer3d.counts.docks")}: {data.docks.length}</li>
                            <li>{t("viewer3d.counts.storage")}: {data.storageAreas.length}</li>
                            <li>{t("viewer3d.counts.vessels")}: {data.vessels.length}</li>
                            <li>{t("viewer3d.counts.containers")}: {data.containers.length}</li>
                            <li>{t("viewer3d.counts.resources")}: {data.resources.length}</li>
                        </ul>

                        <div className="viewer3d-picked">
                            <h4>{t("viewer3d.selection")}</h4>
                            {picked ? (
                                <div className="picked-card">
                                    <div className="k">Type</div><div className="v">{picked.type}</div>
                                    <div className="k">Label</div><div className="v">{picked.label}</div>
                                    <div className="k">Id</div><div className="v small">{picked.id}</div>
                                </div>
                            ) : <p>{t("viewer3d.clickHint")}</p>}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
