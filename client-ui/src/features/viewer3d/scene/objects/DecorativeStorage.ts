// src/features/viewer3d/scene/objects/DecorativeStorage.ts
import * as THREE from "three";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";

export type DecorativeNode = {
    zone: string;
    widthM: number; depthM: number; heightM: number; // heightM passa a ser “mínimo”
    positionX: number; positionZ: number; rotationY: number;
};

const MAT_PH = new THREE.MeshStandardMaterial({ color: 0xffd44d, metalness: 0, roughness: 1 });
const LIFT_EPS = 0.01;

/** Enche footprint e “engrossa” o Y:
 *  - XZ_FILL_BIAS: ligeiro overscale para garantir cobertura
 *  - Y_ASPECT_GAIN: multiplica o mesmo fator de XZ no eixo Y (evita flatten)
 *  - MIN_HEIGHT_M: altura mínima absoluta (além de heightM do placement)
 */
const XZ_FILL_BIAS  = 1.00;  // de 1.02 -> 1.00 (não exagera no fill)
const Y_ASPECT_GAIN = 1.05;  // de 1.15 -> 1.05 (menos “gordo” em Y)
const MIN_HEIGHT_M  = 3.2;   // de 4.0 -> 3.2 (altura mínima mais contida)


/* ---------- helpers ---------- */
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

/** “Fill” no XZ, e Y acompanha (com ganho) + clamp a altura mínima. */
function fillXZ_andGrowY(obj: THREE.Object3D, W: number, Hmin: number, D: number) {
    const { size } = getSize(obj);

    // escala para encher o footprint
    const sx = W / Math.max(size.x, 1e-6);
    const sz = D / Math.max(size.z, 1e-6);
    const sXZ = Math.max(sx, sz) * XZ_FILL_BIAS;

    // Y acompanha o mesmo fator (evita “flat”) com um ganho extra
    let sY = sXZ * Y_ASPECT_GAIN;

    // garantir altura mínima (entre MIN_HEIGHT_M e Hmin vindo do placement)
    const targetMin = Math.max(MIN_HEIGHT_M, Hmin);
    const currentHeight = size.y * sY;
    if (currentHeight < targetMin) {
        sY *= targetMin / Math.max(currentHeight, 1e-6);
    }

    obj.scale.set(sXZ, sY, sXZ);
}

/* placeholder box imediato (apenas para não piscar) */
function makePlaceholderBox(W: number, H: number, D: number) {
    const geom = new THREE.BoxGeometry(W, H, D);
    const mesh = new THREE.Mesh(geom, MAT_PH);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.name = "DecorativeStorage:placeholder";
    mesh.position.y = H / 2; // base em y=0
    return mesh;
}

function normalizeDecorativeModel(raw: THREE.Object3D, W: number, Hmin: number, D: number) {
    const core = new THREE.Group();
    core.name = "DecorativeStorage:core";
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
    fillXZ_andGrowY(core, W, Hmin, D); // <<< evita “aplastado”
    centerOnBottom(core);
    return core;
}

/**
 * DecorativeStorage:
 *  - placeholder amarelo imediato;
 *  - carrega GLB decorativeBuilding e preenche o footprint;
 *  - Y cresce de forma proporcional (e nunca abaixo da altura mínima).
 */
export function makeDecorativeStorage(n: DecorativeNode): THREE.Group {
    const W = Math.max(1, Number(n.widthM));
    const Hmin = Math.max(0.1, Number(n.heightM)); // tratado como “mínimo”
    const D = Math.max(1, Number(n.depthM));

    const g = new THREE.Group();
    g.name = `DecorativeStorage:${n.zone}`;
    g.userData = { type: "DecorativeStorage", zone: n.zone };

    const ph = makePlaceholderBox(W, Math.max(Hmin, MIN_HEIGHT_M), D);
    g.add(ph);

    // posicionamento
    g.position.set(Number(n.positionX) || 0, LIFT_EPS, Number(n.positionZ) || 0);
    g.rotation.y = Number(n.rotationY) || 0;

    (async () => {
        try {
            const raw = await loadGLB(ASSETS_MODELS.buildings.factoryBuilding);
            const core = normalizeDecorativeModel(raw, W, Hmin, D);
            g.remove(ph);
            core.name = "DecorativeStorage:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha ao carregar GLB DecorativeStorage:", e);
            // mantém placeholder se falhar
        }
    })();

    return g;
}
