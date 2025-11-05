// src/features/viewer3d/components/ThreeScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData } from "../types";

type Layers = { docks: boolean; storage: boolean; vessels: boolean; containers: boolean; resources: boolean };
type Props = { data: SceneData; visible: Layers; onPick?: (p:{type:string;id:string;label:string})=>void };

function finite(n: any, fallback: number) {
    const v = Number(n); return Number.isFinite(v) ? v : fallback;
}
function safeSize(n: any, min: number, fallback: number) {
    const v = finite(n, fallback); return Math.max(min, v);
}

export default function ThreeScene({ data, visible, onPick }: Props) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const initialized = useRef(false);

    const gDocksRef = useRef<THREE.Group | null>(null);
    const gStorageRef = useRef<THREE.Group | null>(null);
    const gVesselsRef = useRef<THREE.Group | null>(null);
    const gContainersRef = useRef<THREE.Group | null>(null);
    const gResourcesRef = useRef<THREE.Group | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        if (initialized.current) return;
        initialized.current = true;

        while (mountRef.current.firstChild) mountRef.current.removeChild(mountRef.current.firstChild);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf4f6fb);

        const camera = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1, 8000
        );
        camera.position.set(120, 120, 220);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.85));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(100, 200, 100); scene.add(dir);

        scene.add(new THREE.GridHelper(2000, 200));
        const axes = new THREE.AxesHelper(20); axes.position.set(0, 0.01, 0); scene.add(axes);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.target.set(40, 0, 40);

        const gDocks = new THREE.Group(), gStorage = new THREE.Group(),
            gVessels = new THREE.Group(), gContainers = new THREE.Group(), gResources = new THREE.Group();
        gDocks.name="docks"; gStorage.name="storage"; gVessels.name="vessels"; gContainers.name="containers"; gResources.name="resources";
        scene.add(gDocks, gStorage, gVessels, gContainers, gResources);
        gDocksRef.current=gDocks; gStorageRef.current=gStorage; gVesselsRef.current=gVessels; gContainersRef.current=gContainers; gResourcesRef.current=gResources;

        const matDock       = new THREE.MeshStandardMaterial({ color: 0x9bb1ff, metalness: 0.1, roughness: 0.8 });
        const matStorage    = new THREE.MeshStandardMaterial({ color: 0xbfe9a5, metalness: 0.1, roughness: 0.8 });
        const matVessel     = new THREE.MeshStandardMaterial({ color: 0x2e8197, metalness: 0.2, roughness: 0.6 });
        const matContainer  = new THREE.MeshStandardMaterial({ color: 0xd0a06f, metalness: 0.1, roughness: 0.8 });
        const matResource   = new THREE.MeshStandardMaterial({ color: 0x7e6bb6, metalness: 0.1, roughness: 0.8 });

        const pickables: THREE.Object3D[] = [];

        // --- Docks ---
        data.docks.forEach((d) => {
            const L = safeSize(d.lengthM,  5, 80);
            const W = safeSize(d.depthM,   3, 15);
            const H = safeSize(d.maxDraftM,1,  6);
            const geom = new THREE.BoxGeometry(L, H, W);
            const mesh = new THREE.Mesh(geom, matDock);
            mesh.position.set(finite(d.positionX, 0), H/2, finite(d.positionZ, 0));
            mesh.userData = { type:"Dock", id: d.id, label: d.code };
            gDocks.add(mesh); pickables.push(mesh);
        });

        // --- Storage Areas ---
        data.storageAreas.forEach((sa) => {
            const W = safeSize(sa.widthM,  2, 10);
            const H = safeSize(sa.heightM, 1,  3);
            const D = safeSize(sa.depthM,  2, 10);
            const geom = new THREE.BoxGeometry(W, H, D);
            const mesh = new THREE.Mesh(geom, matStorage);
            mesh.position.set(finite(sa.positionX, 0), H/2, finite(sa.positionZ, 0));
            mesh.userData = { type:"StorageArea", id: sa.id, label: sa.name };
            gStorage.add(mesh); pickables.push(mesh);
        });

        // --- Vessels ---
        data.vessels.forEach((v) => {
            const L = safeSize(v.lengthMeters, 20, 140);
            const W = safeSize(v.widthMeters,  6,  22);
            const H = safeSize((v.draftMeters ?? 7) + 5, 5, 12);
            const geom = new THREE.BoxGeometry(L, H, W);
            const mesh = new THREE.Mesh(geom, matVessel);
            mesh.position.set(finite(v.positionX, 0), H/2, finite(v.positionZ, 0));
            mesh.rotation.y = Math.PI * 0.25;
            mesh.userData = { type:"Vessel", id: v.id, label: `${v.name} (${v.imoNumber})` };
            gVessels.add(mesh); pickables.push(mesh);
        });

        // --- Containers ---
        data.containers.forEach((c) => {
            const geom = new THREE.BoxGeometry(6.06, 2.59, 2.44);
            const mesh = new THREE.Mesh(geom, matContainer);
            const y = finite(c.positionY, 0) + 1.295; // half height
            mesh.position.set(finite(c.positionX, 0), y, finite(c.positionZ, 0));
            mesh.userData = { type:"Container", id: c.id, label: c.isoCode };
            gContainers.add(mesh); pickables.push(mesh);
        });

        // --- Physical Resources ---
        data.resources.forEach((r) => {
            const geom = new THREE.SphereGeometry(2, 16, 16);
            const mesh = new THREE.Mesh(geom, matResource);
            mesh.position.set(finite(r.positionX, 0), 2, finite(r.positionZ, 0));
            mesh.userData = { type:"PhysicalResource", id: r.id, label: r.code };
            gResources.add(mesh); pickables.push(mesh);
        });

        // visibilidade inicial
        const applyVisibility = () => {
            gDocks.visible      = visible.docks;
            gStorage.visible    = visible.storage;
            gVessels.visible    = visible.vessels;
            gContainers.visible = visible.containers;
            gResources.visible  = visible.resources;
        };
        applyVisibility();

        // auto-frame
        const box = new THREE.Box3();
        pickables.forEach(o => box.expandByObject(o));
        if (!box.isEmpty()) {
            const size = new THREE.Vector3(), center = new THREE.Vector3();
            box.getSize(size); box.getCenter(center);
            const maxSize = Math.max(size.x, size.y, size.z);
            const distance = maxSize * 1.5 / Math.tan((camera.fov * Math.PI) / 360);
            const dir = new THREE.Vector3(1,1,1).normalize();
            controls.target.copy(center);
            camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
            camera.near = Math.max(0.1, maxSize / 1000);
            camera.far  = Math.max(2000, distance * 10);
            camera.updateProjectionMatrix();
        }

        // picking
        const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
        const onClick = (ev: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObjects(pickables, false);
            if (hits.length > 0) {
                const u = hits[0].object.userData || {};
                onPick?.({ type: u.type ?? "Unknown", id: u.id ?? "", label: u.label ?? "" });
            }
        };
        renderer.domElement.addEventListener("click", onClick);

        // resize
        const onResize = () => {
            if (!mountRef.current) return;
            const { clientWidth, clientHeight } = mountRef.current;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };
        window.addEventListener("resize", onResize);

        // loop
        let req = 0; const loop = () => { controls.update(); renderer.render(scene, camera); req = requestAnimationFrame(loop); }; loop();

        return () => {
            cancelAnimationFrame(req);
            window.removeEventListener("resize", onResize);
            renderer.domElement.removeEventListener("click", onClick);
            renderer.dispose();
            scene.traverse((o) => {
                const m = o as THREE.Mesh;
                (m.geometry as any)?.dispose?.();
                const mat = m.material as THREE.Material | THREE.Material[] | undefined;
                if (Array.isArray(mat)) mat.forEach((mm) => (mm as any)?.dispose?.());
                else (mat as any)?.dispose?.();
            });
            if (mountRef.current?.contains(renderer.domElement)) mountRef.current.removeChild(renderer.domElement);
            initialized.current = false;
        };
    }, [data]);

    useEffect(() => {
        if (gDocksRef.current)      gDocksRef.current.visible = visible.docks;
        if (gStorageRef.current)    gStorageRef.current.visible = visible.storage;
        if (gVesselsRef.current)    gVesselsRef.current.visible = visible.vessels;
        if (gContainersRef.current) gContainersRef.current.visible = visible.containers;
        if (gResourcesRef.current)  gResourcesRef.current.visible = visible.resources;
    }, [visible]);

    return <div className="viewer3d-canvas" ref={mountRef} />;
}
