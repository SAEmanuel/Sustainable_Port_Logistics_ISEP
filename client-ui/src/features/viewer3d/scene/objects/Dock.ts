import * as THREE from "three";
import type { DockDto } from "../../types";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";

/* =========================================
   Ajustes visuais
========================================= */
const VERTICAL_DROP_M = 10; // quanto fica abaixo do piso (positivo = mais baixo)

/* =========================================
   Tipos utilitários (compatíveis com portGrids)
========================================= */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Grid = { rect: Rect; rows: number; cols: number };
export type GridsResult = {
    C: Record<`C.${1|2|3|4|5|6|7|8|9|10}`, Grid>;
    A: { "A.1": Grid; "A.2": Grid };
    B: { "B.1": Grid; "B.2": Grid };
};

/** Dock para render (permite rotationY opcional no cliente) */
export type DockRender = DockDto & { rotationY?: number };

/* =========================================
   Helpers de normalização (BBox)
========================================= */
function getSize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    return { box, size };
}

/** Pivot na base (base a y=0) */
function centerOnBottom(obj: THREE.Object3D) {
    const { box } = getSize(obj);
    const center = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Vector3(center.x, box.min.y, center.z);
    obj.position.sub(pivot);
}

/** Escalar para caber exactamente em L×H×W */
function fitToSize(obj: THREE.Object3D, L: number, H: number, W: number) {
    const { size } = getSize(obj);
    const sx = L / Math.max(size.x, 1e-6);
    const sy = H / Math.max(size.y, 1e-6);
    const sz = W / Math.max(size.z, 1e-6);
    obj.scale.set(sx, sy, sz);
}

/* =========================================
   Placeholder (aparece imediatamente)
========================================= */
function makeDockPlaceholderBox(L: number, H: number, W: number) {
    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x4f5963, metalness: 0.15, roughness: 0.9 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Dock:placeholder";
    // base em y=0
    mesh.position.y = H / 2;
    return mesh;
}

/* =========================================
   Normalização do GLB do dock
========================================= */
function normalizeDockModel(raw: THREE.Object3D, L: number, H: number, W: number) {
    const core = new THREE.Group();
    core.name = "Dock:core";
    core.add(raw);

    // sombras + sRGB
    core.traverse((o: any) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const m = o.material;
            if (Array.isArray(m)) m.forEach(mm => { if (mm?.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
            else if (m?.map) m.map.colorSpace = THREE.SRGBColorSpace;
        }
    });

    // --- Heurística: se o Z for claramente maior que X, roda 90º para que o comprimento fique no X
    const box0 = new THREE.Box3().setFromObject(core);
    const size0 = box0.getSize(new THREE.Vector3());
    if (size0.z > size0.x * 1.25) {
        core.rotation.y = Math.PI / 2; // troca X<->Z
    }

    // Pivot na base → escalar → recentrar
    centerOnBottom(core);
    fitToSize(core, L, H, W);
    centerOnBottom(core);

    return core;
}

/* =========================================
   API: construir Dock (placeholder + swap por GLB)
========================================= */
export function makeDock(d: DockRender): THREE.Group {
    const L = Math.max(1, Number(d.lengthM)   || 20);
    const W = Math.max(1, Number(d.depthM)    || 12);
    const H = Math.max(1, Number(d.maxDraftM) || 5);

    // Invólucro externo
    const g = new THREE.Group();
    g.name = `Dock:${d.code ?? d.id ?? "?"}`;
    g.userData = { type: "Dock", id: d.id, label: d.code };

    // Placeholder imediato (base em y=0)
    const ph = makeDockPlaceholderBox(L, H, W);
    g.add(ph);

    // Posição/rotação
    const x = Number(d.positionX) || 0;
    const z = Number(d.positionZ) || 0;
    const rotY = Number(d.rotationY ?? 0);

    // base assenta no chão e desce um bocado
    g.position.set(x, -VERTICAL_DROP_M, z);
    g.rotation.y = rotY;

    // Carregar GLB e substituir placeholder
    (async () => {
        try {
            const raw = await loadGLB(ASSETS_MODELS.docks.straight);
            const core = normalizeDockModel(raw, L, H, W);
            g.remove(ph);
            core.name = "Dock:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha ao carregar GLB de Dock:", e);
            // mantém placeholder
        }
    })();

    return g;
}
