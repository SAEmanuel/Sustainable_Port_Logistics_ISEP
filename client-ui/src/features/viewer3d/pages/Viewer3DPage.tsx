import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import ThreeScene, {
    type ThreeSceneHandle,
} from "../components/ThreeScene";
import { loadSceneData } from "../services/viewer3dService";
import type { SceneData } from "../types";
import { useTranslation } from "react-i18next";
import "../style/viewer3d.css";

import { InfoOverlay } from "../components/InfoOverlay";
import type { SelectedEntityInfo } from "../types/selection";
import { mapPickedToSelection } from "../types/selection";
import {type Role } from "../../../app/types";
import { useAppStore } from "../../../app/store";

type Layers = {
    docks: boolean;
    storage: boolean;
    vessels: boolean;
    containers: boolean;
    resources: boolean;
};

type SimplePick = { type: string; id: string; label: string };

export default function Viewer3DPage() {
    const { t } = useTranslation();

    // user vindo do backend (SyncUser + useAppStore)
    const { user } = useAppStore();
    const currentRole: Role | null = (user?.role ?? null) as Role | null;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<SceneData>({
        docks: [],
        storageAreas: [],
        vessels: [],
        containers: [],
        resources: [],
    });

    const [layers, setLayers] = useState<Layers>({
        docks: true,
        storage: true,
        vessels: true,
        containers: true,
        resources: true,
    });

    // seleção + overlay
    const [selected, setSelected] = useState<SelectedEntityInfo | null>(
        null,
    );
    const [showInfo, setShowInfo] = useState(true);

    const canShow = useMemo(
        () => !loading && !err,
        [loading, err],
    );

    // ===== Fullscreen control =====
    const sceneHandle = useRef<ThreeSceneHandle | null>(null);
    const [isFs, setIsFs] = useState(false);

    const enterFs = useCallback(() => {
        const el = sceneHandle.current?.getHost();
        if (!el) return;
        // @ts-ignore Safari
        (el.requestFullscreen ||
            (el as any).webkitRequestFullscreen)?.call(el, {
            navigationUI: "hide",
        });
    }, []);
    const exitFs = useCallback(() => {
        // @ts-ignore Safari
        (document.exitFullscreen ||
            (document as any).webkitExitFullscreen)?.call(
            document,
        );
    }, []);
    const toggleFs = useCallback(() => {
        // @ts-ignore Safari
        const current =
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement;
        const host = sceneHandle.current?.getHost();
        if (current === host) exitFs();
        else enterFs();
    }, [enterFs, exitFs]);

    useEffect(() => {
        const onFsChange = () => {
            // @ts-ignore Safari
            const current =
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement;
            const host = sceneHandle.current?.getHost();
            const active = !!host && current === host;
            setIsFs(active);
            sceneHandle.current?.forceResize();
        };
        document.addEventListener("fullscreenchange", onFsChange);
        // @ts-ignore
        document.addEventListener(
            "webkitfullscreenchange",
            onFsChange,
        );

        const onKey = (e: KeyboardEvent) => {
            // Alt+Enter → fullscreen
            if (e.altKey && e.key === "Enter") {
                e.preventDefault();
                toggleFs();
            }

            // tecla "i" → toggle overlay de info
            if (!e.altKey && (e.key === "i" || e.key === "I")) {
                setShowInfo((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                onFsChange,
            );
            // @ts-ignore
            document.removeEventListener(
                "webkitfullscreenchange",
                onFsChange,
            );
            window.removeEventListener("keydown", onKey);
        };
    }, [toggleFs]);

    // ===== Fetch =====
    useEffect(() => {
        let alive = true;
        setLoading(true);
        loadSceneData()
            .then((d) => {
                if (alive) {
                    setData(d);
                    setErr(null);
                }
            })
            .catch((e) => {
                if (alive)
                    setErr(
                        e?.message ?? "Failed to load 3D data.",
                    );
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const toggleLayer = (k: keyof Layers) =>
        setLayers((s) => ({ ...s, [k]: !s[k] }));

    // quando o ThreeScene faz picking
    const handlePick = useCallback(
        (raw: SimplePick) => {
            const mapped = mapPickedToSelection(raw, data);
            setSelected(mapped);
        },
        [data],
    );

    const rolesForOverlay = currentRole ? [currentRole] : [];

    return (
        <div className="viewer3d-wrapper">
            <div className="viewer3d-header">
                {/* Esquerda: título + chips estatísticos (que agora são toggles) */}
                <div className="viewer3d-header-main">
                    <h2>{t("viewer3d.title")}</h2>
                    <div className="viewer3d-stats-row">
                        <button
                            type="button"
                            className={`viewer3d-stat-btn ${
                                layers.docks ? "on" : "off"
                            }`}
                            onClick={() => toggleLayer("docks")}
                        >
                            <span className="viewer3d-stat-icon">
                                ⚓
                            </span>
                            <span className="viewer3d-stat-label">
                                Docks
                            </span>
                            <span className="viewer3d-stat-value">
                                {data.docks.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`viewer3d-stat-btn ${
                                layers.storage ? "on" : "off"
                            }`}
                            onClick={() => toggleLayer("storage")}
                        >
                            <span className="viewer3d-stat-icon">
                                🧺
                            </span>
                            <span className="viewer3d-stat-label">
                                Armazenamento
                            </span>
                            <span className="viewer3d-stat-value">
                                {data.storageAreas.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`viewer3d-stat-btn ${
                                layers.vessels ? "on" : "off"
                            }`}
                            onClick={() => toggleLayer("vessels")}
                        >
                            <span className="viewer3d-stat-icon">
                                🚢
                            </span>
                            <span className="viewer3d-stat-label">
                                Navios
                            </span>
                            <span className="viewer3d-stat-value">
                                {data.vessels.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`viewer3d-stat-btn ${
                                layers.containers ? "on" : "off"
                            }`}
                            onClick={() => toggleLayer("containers")}
                        >
                            <span className="viewer3d-stat-icon">
                                📦
                            </span>
                            <span className="viewer3d-stat-label">
                                Contentores
                            </span>
                            <span className="viewer3d-stat-value">
                                {data.containers.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`viewer3d-stat-btn ${
                                layers.resources ? "on" : "off"
                            }`}
                            onClick={() => toggleLayer("resources")}
                        >
                            <span className="viewer3d-stat-icon">
                                🛠️
                            </span>
                            <span className="viewer3d-stat-label">
                                Recursos
                            </span>
                            <span className="viewer3d-stat-value">
                                {data.resources.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Direita: só o botão de ecrã inteiro */}
                <div className="viewer3d-actions">
                    <button
                        className={`chip ${isFs ? "on" : ""}`}
                        onClick={toggleFs}
                        title="Alt+Enter"
                    >
                        {isFs
                            ? t("viewer3d.fullscreenExit")
                            : t("viewer3d.fullscreen")}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="viewer3d-fallback">
                    {t("viewer3d.loading")}
                </div>
            )}
            {err && (
                <div className="viewer3d-error">
                    {t("viewer3d.errorPrefix")} {err}
                </div>
            )}

            {canShow && (
                <div className="viewer3d-stage viewer3d-stage-full">
                    <ThreeScene
                        ref={sceneHandle}
                        data={data}
                        visible={layers as any}
                        onPick={handlePick}
                    />
                    <InfoOverlay
                        visible={showInfo}
                        selected={selected}
                        roles={rolesForOverlay}
                    />
                </div>
            )}
        </div>
    );
}
