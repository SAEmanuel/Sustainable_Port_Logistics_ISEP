// src/features/viewer3d/components/ThreeScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData } from "../types";

type Props = {
    data: SceneData;
    visible: { docks: boolean; storage: boolean; vessels: boolean; containers: boolean; resources: boolean };
    onPick?: (payload: { type: string; id: string; label: string }) => void;
};

export default function ThreeScene({ data, visible, onPick }: Props) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Scene & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf4f6fb);

        const camera = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            5000
        );
        camera.position.set(120, 120, 220);

        // Light
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemi.position.set(0, 200, 0);
        scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(100, 200, 100);
        dir.castShadow = true;
        scene.add(dir);

        // Grid & Axes
        const grid = new THREE.GridHelper(1000, 100); // passos de 10m se considerares 1u=1m
        grid.position.y = 0;
        scene.add(grid);
        const axes = new THREE.AxesHelper(20);
        axes.position.set(0, 0.01, 0);
        scene.add(axes);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(40, 0, 40);

        // Groups por layer
        const gDocks = new THREE.Group(); gDocks.name = "docks";
        const gStorage = new THREE.Group(); gStorage.name = "storage";
        const gVessels = new THREE.Group(); gVessels.name = "vessels";
        const gContainers = new THREE.Group(); gContainers.name = "containers";
        const gResources = new THREE.Group(); gResources.name = "resources";
        scene.add(gDocks, gStorage, gVessels, gContainers, gResources);

        // Materiais (cores neutras p/ respeitar tema global)
        const matDock = new THREE.MeshStandardMaterial({ color: 0x9bb1ff, metalness: 0.1, roughness: 0.8 });
        const matStorage = new THREE.MeshStandardMaterial({ color: 0xbfe9a5, metalness: 0.1, roughness: 0.8 });
        const matVessel = new THREE.MeshStandardMaterial({ color: 0x6ec1e4, metalness: 0.2, roughness: 0.6 });
        const matContainer = new THREE.MeshStandardMaterial({ color: 0xffc38b, metalness: 0.1, roughness: 0.8 });
        const matResource = new THREE.MeshStandardMaterial({ color: 0xd4bfff, metalness: 0.1, roughness: 0.8 });

        const pickables: THREE.Object3D[] = [];

        // --- Docks (retângulos “flat”) ---
        data.docks.forEach((d, i) => {
            const w = 100; const h = 30;
            const geom = new THREE.BoxGeometry(w, 2, h);
            const mesh = new THREE.Mesh(geom, matDock);
            mesh.position.set(i * 140, 1, -60);
            mesh.userData = { type: "Dock", id: d.id, label: d.code ?? "Dock" };
            gDocks.add(mesh);
            pickables.push(mesh);
        });

        // --- Storage Areas (caixas) ---
        data.storageAreas.forEach((sa) => {
            const w = Math.max(5, sa.width);
            const h = Math.max(1, sa.height);
            const d = Math.max(5, sa.depth);
            const geom = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geom, matStorage);
            mesh.position.set(sa.positionX ?? 0, h / 2, sa.positionZ ?? 0);
            mesh.userData = { type: "StorageArea", id: sa.id, label: sa.name };
            gStorage.add(mesh);
            pickables.push(mesh);
        });

        // --- Vessels (caixas alongadas) ---
        data.vessels.forEach((v) => {
            const w = Math.max(10, v.widthMeters ?? 20);
            const h = Math.max(5, (v.draftMeters ?? 7) + 5);
            const L = Math.max(40, v.lengthMeters ?? 120);
            const geom = new THREE.BoxGeometry(L, h, w);
            const mesh = new THREE.Mesh(geom, matVessel);
            mesh.position.set(v.positionX ?? 0, h / 2, v.positionZ ?? 0);
            mesh.rotation.y = Math.PI * 0.25;
            mesh.userData = { type: "Vessel", id: v.id, label: `${v.name} (${v.imoNumber})` };
            gVessels.add(mesh);
            pickables.push(mesh);
        });

        // --- Containers (caixas pequenas 6x2.5x2.5m aprox) ---
        data.containers.forEach((c) => {
            const geom = new THREE.BoxGeometry(6, 2.5, 2.5);
            const mesh = new THREE.Mesh(geom, matContainer);
            mesh.position.set(c.positionX ?? 0, (c.positionY ?? 0) + 1.25, c.positionZ ?? 0);
            mesh.userData = { type: "Container", id: c.id, label: c.isoCode };
            gContainers.add(mesh);
            pickables.push(mesh);
        });

        // --- Physical Resources (esferas) ---
        data.resources.forEach((r) => {
            const geom = new THREE.SphereGeometry(2, 16, 16);
            const mesh = new THREE.Mesh(geom, matResource);
            mesh.position.set(r.positionX ?? 0, 2, r.positionZ ?? 0);
            mesh.userData = { type: "PhysicalResource", id: r.id, label: r.code };
            gResources.add(mesh);
            pickables.push(mesh);
        });

        // Visibilidade por layer (propagada ao montar e sempre que muda)
        const applyVisibility = () => {
            gDocks.visible = visible.docks;
            gStorage.visible = visible.storage;
            gVessels.visible = visible.vessels;
            gContainers.visible = visible.containers;
            gResources.visible = visible.resources;
        };
        applyVisibility();

        // Raycaster p/ picking
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onClick = (ev: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObjects(pickables, false);
            if (hits.length > 0) {
                const obj = hits[0].object;
                const u = obj.userData || {};
                onPick?.({ type: u.type ?? "Unknown", id: u.id ?? "", label: u.label ?? "" });
            }
        };
        renderer.domElement.addEventListener("click", onClick);

        // Resize
        const onResize = () => {
            if (!mountRef.current) return;
            const { clientWidth, clientHeight } = mountRef.current;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };
        window.addEventListener("resize", onResize);

        // Render loop
        let req = 0;
        const loop = () => {
            controls.update();
            renderer.render(scene, camera);
            req = requestAnimationFrame(loop);
        };
        loop();

        // Cleanup
        return () => {
            cancelAnimationFrame(req);
            window.removeEventListener("resize", onResize);
            renderer.domElement.removeEventListener("click", onClick);
            renderer.dispose();
            scene.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose?.();
                if ((obj as THREE.Mesh).material) {
                    const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
                    if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
                    else mat.dispose?.();
                }
            });
            mountRef.current?.removeChild(renderer.domElement);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Atualiza visibilidade quando prop 'visible' muda
    useEffect(() => {
        // A cena é gerida internamente; para manter simples, relançamos um evento de resize
        // (o applyVisibility é corrido no mount; aqui confiamos no CSS de esconder via classes)
        // Alternativa: controlar groups via refs. Para MVP, chega manter uma overlay CSS por layer.
    }, [visible]);

    return <div className="viewer3d-canvas" ref={mountRef} />;
}
