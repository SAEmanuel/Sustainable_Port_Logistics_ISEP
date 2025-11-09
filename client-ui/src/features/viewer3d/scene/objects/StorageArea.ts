// src/features/viewer3d/scene/objects/StorageArea.ts
import * as THREE from "three";
import type { StorageAreaDto } from "../../types";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";
import { Materials } from "../Materials";

/* ===================== Tunables (corredores / altura) ===================== */
/** Quanto menor, mais corredor entre armazéns (aplica-se a X e Z). */
const FOOTPRINT_SCALE = 0.65;
/** Escala vertical para aumentar pé-direito do modelo. */
const HEIGHT_SCALE = 3;
/** Elevação mínima para evitar z-fighting com o pavimento. */
const LIFT_EPS = 0.01; // 1 cm

/* ========================== BBox helpers ========================== */
function getSize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    return { box, size };
}

/** Coloca o pivot no centro da base (base a y=0). */
function centerOnBottom(obj: THREE.Object3D) {
    const { box } = getSize(obj);
    const center = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Vector3(center.x, box.min.y, center.z);
    obj.position.sub(pivot);
}

/** Escala o objeto para caber exactamente em W×H×D. */
function fitToSize(obj: THREE.Object3D, W: number, H: number, D: number) {
    const { size } = getSize(obj);
    const sx = W / Math.max(size.x, 1e-6);
    const sy = H / Math.max(size.y, 1e-6);
    const sz = D / Math.max(size.z, 1e-6);
    obj.scale.set(sx, sy, sz);
}

/* ========================== Placeholder =========================== */
function makeSAPlaceholderBox(W: number, H: number, D: number) {
    const geom = new THREE.BoxGeometry(W, H, D);
    const mesh = new THREE.Mesh(geom, Materials.storage);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.name = "StorageArea:placeholder";
    // base do placeholder em y=0
    mesh.position.y = H / 2;
    return mesh;
}

/* ========== Normalização do GLB (pivot base + escala) ========== */
function normalizeWarehouseModel(raw: THREE.Object3D, W: number, H: number, D: number) {
    const core = new THREE.Group();
    core.name = "StorageArea:core";
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

    centerOnBottom(core);
    fitToSize(core, W, H, D);
    centerOnBottom(core); // recentra após escala

    return core;
}

/* ============================ API ============================ */
/**
 * Cria uma Storage Area:
 * - coloca placeholder de imediato (não bloqueia render);
 * - carrega Warehouse GLB e substitui quando terminar;
 * - mantém posição/rotação; assenta no chão (sem flutuar).
 */
export function makeStorageArea(sa: StorageAreaDto): THREE.Group {
    // Tamanhos base definidos pelo layout
    const baseW = Math.max(2, Number(sa.widthM)  || 10); // X
    const baseH = Math.max(1, Number(sa.heightM) ||  3); // Y
    const baseD = Math.max(2, Number(sa.depthM)  || 10); // Z

    // Aplicar fatores (corredores + altura)
    const W = baseW * FOOTPRINT_SCALE;
    const H = baseH * HEIGHT_SCALE;
    const D = baseD * FOOTPRINT_SCALE;

    // Grupo externo (mantém API/posicionamento)
    const g = new THREE.Group();
    g.name = `StorageArea:${sa.name ?? sa.id ?? "?"}`;
    g.userData = { type: "StorageArea", id: sa.id, label: sa.name };

    // Placeholder imediato
    const ph = makeSAPlaceholderBox(W, H, D);
    g.add(ph);

    // Posicionamento/rotação — força base ao chão (y=0) + lift anti z-fighting
    const x = Number(sa.positionX) || 0;
    const z = Number(sa.positionZ) || 0;
    const rotY = Number((sa as any).rotationY) || 0;

    g.position.set(x, LIFT_EPS, z);
    g.rotation.y = rotY;

    // Carregar o GLB e substituir o placeholder
    (async () => {
        try {
            const raw = await loadGLB(ASSETS_MODELS.storageArea.wareHouser);
            const core = normalizeWarehouseModel(raw, W, H, D);
            g.remove(ph);
            core.name = "StorageArea:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha ao carregar GLB de StorageArea:", e);
            // mantém placeholder se falhar
        }
    })();

    return g;
}
