import * as THREE from "three";
import type { VesselDto } from "../../types";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";

/* Tunables visuais (altura do casco) */
const FREEBOARD_M = 18;
const HEIGHT_SCALE = 4;
const LIFT_EPS = 0.0;

function getSize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    return { box, size };
}
function centerOnBottom(obj: THREE.Object3D) {
    const { box } = getSize(obj);
    const center = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Vector3(center.x, box.min.y, center.z);
    obj.position.sub(pivot);
}
function fitToSize(obj: THREE.Object3D, L: number, H: number, W: number) {
    const { size } = getSize(obj);
    const sx = L / Math.max(size.x, 1e-6);
    const sy = H / Math.max(size.y, 1e-6);
    const sz = W / Math.max(size.z, 1e-6);
    obj.scale.set(sx, sy, sz);
}
function safe(n: any, min: number, fallback: number) {
    const v = Number(n);
    return Math.max(min, Number.isFinite(v) ? v : fallback);
}
function num(n: any, fallback: number) {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
}

function makeVesselPlaceholderBox(L: number, H: number, W: number) {
    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x2e8197, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Vessel:placeholder";
    mesh.position.y = H / 2;
    return mesh;
}

function normalizeVesselModel(raw: THREE.Object3D, L: number, H: number, W: number) {
    const core = new THREE.Group();
    core.name = "Vessel:core";
    core.add(raw);

    core.traverse((o: any) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const m = o.material;
            if (Array.isArray(m)) m.forEach(mm => { if (mm?.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
            else if (m?.map) m.map.colorSpace = THREE.SRGBColorSpace;
        }
    });

    const box0 = new THREE.Box3().setFromObject(core);
    const s0 = box0.getSize(new THREE.Vector3());
    if (s0.z > s0.x * 1.25) core.rotation.y = Math.PI / 2;

    centerOnBottom(core);
    fitToSize(core, L, H, W);
    centerOnBottom(core);

    return core;
}

export function makeVessel(v: VesselDto): THREE.Group {
    const L = safe((v as any).lengthMeters, 20, 70);
    const W = safe((v as any).widthMeters,   6, 18);

    const draft = num((v as any).draftMeters ?? 7, 7);
    const H = Math.max(5, draft + FREEBOARD_M) * HEIGHT_SCALE;

    const g = new THREE.Group();
    g.name = `Vessel:${(v as any).name ?? v.id ?? "?"}`;
    g.userData = { type: "Vessel", id: (v as any).id, label: `${(v as any).name} (${(v as any).imoNumber})` };

    const ph = makeVesselPlaceholderBox(L, H, W);
    g.add(ph);

    const x = num((v as any).positionX, 0);
    const z = num((v as any).positionZ, 0);
    const y = num((v as any).positionY, 0) + LIFT_EPS;
    const rotY = num((v as any).rotationY, 0);
    g.position.set(x, y, z);
    g.rotation.y = rotY;

    (async () => {
        try {
            const raw = await loadGLB(ASSETS_MODELS.vessels.containerShip);
            const core = normalizeVesselModel(raw, L, H, W);
            g.remove(ph);
            core.name = "Vessel:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha ao carregar GLB de Vessel:", e);
        }
    })();

    return g;
}
