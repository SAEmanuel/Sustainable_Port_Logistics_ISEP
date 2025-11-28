import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { SceneData } from "../types";
import { PortScene, type LayerVis } from "../scene/PortScene";

type Props = {
    data: SceneData;
    visible: LayerVis;
    // agora recebemos o userData completo
    onPick?: (userData: any) => void;
};

export type ThreeSceneHandle = {
    getHost: () => HTMLDivElement | null;
    forceResize: () => void;
};

const ThreeScene = forwardRef<ThreeSceneHandle, Props>(
    ({ data, visible, onPick }, ref) => {
        const hostRef = useRef<HTMLDivElement | null>(null);
        const sceneRef = useRef<PortScene | null>(null);
        const initialized = useRef(false);

        useImperativeHandle(ref, () => ({
            getHost: () => hostRef.current,
            forceResize: () => sceneRef.current?.onResize(),
        }));

        useEffect(() => {
            if (!hostRef.current || initialized.current) return;
            initialized.current = true;

            while (hostRef.current.firstChild)
                hostRef.current.removeChild(hostRef.current.firstChild);

            const s = new PortScene(hostRef.current);
            sceneRef.current = s;

            const click = (e: MouseEvent) =>
                s.raycastAt(e, (u) => onPick?.(u)); // passa userData cru

            s.renderer.domElement.addEventListener("click", click);

            s.setLayers(visible);
            s.load(data);

            return () => {
                s.renderer.domElement.removeEventListener("click", click);
                s.dispose();
                initialized.current = false;
                sceneRef.current = null;
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        useEffect(() => {
            sceneRef.current?.load(data);
        }, [data]);

        useEffect(() => {
            sceneRef.current?.setLayers(visible);
        }, [visible]);

        return <div className="viewer3d-canvas" ref={hostRef} />;
    },
);

export default ThreeScene;
