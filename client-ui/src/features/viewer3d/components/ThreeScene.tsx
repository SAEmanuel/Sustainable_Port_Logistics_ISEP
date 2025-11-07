import { useEffect, useRef } from "react";
import type { SceneData } from "../types";
import { PortScene, type LayerVis } from "../scene/PortScene";

type Props = {
    data: SceneData;
    visible: LayerVis;
    onPick?: (payload: { type: string; id: string; label: string }) => void;
};

export default function ThreeScene({ data, visible, onPick }: Props) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<PortScene | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (!hostRef.current) return;
        if (initialized.current) return;
        initialized.current = true;

        // limpar filhos antigos (StrictMode)
        while (hostRef.current.firstChild) hostRef.current.removeChild(hostRef.current.firstChild);

        const s = new PortScene(hostRef.current);
        sceneRef.current = s;

        // click picking
        const click = (e: MouseEvent) => s.raycastAt(e, (u) => {
            onPick?.({ type: u.type ?? "Unknown", id: u.id ?? "", label: u.label ?? "" });
        });
        s.renderer.domElement.addEventListener("click", click);

        // primeira carga
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

    // reagir a dados novos
    useEffect(() => {
        sceneRef.current?.load(data);
    }, [data]);

    // reagir a visibilidade
    useEffect(() => {
        sceneRef.current?.setLayers(visible);
    }, [visible]);

    return <div className="viewer3d-canvas" ref={hostRef} />;
}
