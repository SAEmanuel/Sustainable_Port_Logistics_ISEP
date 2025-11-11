// src/features/viewer3d/scene/objects/PhysicalResource.ts
import * as THREE from "three";
import type { PhysicalResourceDTO } from "../../types";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";
import { Materials } from "../Materials";

/* ================== Helpers de bbox/orientação ================== */
function bbox(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { box, size, center };
}

function centerOnBottom(obj: THREE.Object3D) {
    const { box, center } = bbox(obj);
    const pivot = new THREE.Vector3(center.x, box.min.y, center.z);
    obj.position.sub(pivot);
}

function alignLongestAxisToX(obj: THREE.Object3D) {
    const { size } = bbox(obj);
    if (size.z > size.x) obj.rotateY(Math.PI / 2);
}

/** <<< NOVO: escala uniforme (preserva proporções) >>> */
function uniformScaleToFit(obj: THREE.Object3D, L: number, H: number, W: number) {
    const { size } = bbox(obj);
    const s = Math.min(
        L / Math.max(size.x, 1e-6),
        H / Math.max(size.y, 1e-6),
        W / Math.max(size.z, 1e-6),
    );
    obj.scale.setScalar(s);
}

function normalizeBaseY(yRaw: number | undefined | null, H: number): number {
    if (!isFinite(Number(yRaw))) return 0;
    const y = Number(yRaw);
    const eps = 0.05 * H;
    if (Math.abs(y - H / 2) < eps) return y - H / 2; // veio do centro → passa para base
    return y;
}

/* ================== Mapas de tipos → modelos/footprints ================== */
type PType =
    | "STSCrane" | "YGCrane" | "MCrane"
    | "Truck" | "Forklift" | "RStacker" | "SCarrier"
    | "TugBoat" | "Other";

type PStatus = "Available" | "Unavailable" | "UnderMaintenance";

/** URL do modelo por tipo (ajusta conforme o teu assets.ts) */
const TYPE_TO_MODEL: Partial<Record<PType, string>> = {
    STSCrane: ASSETS_MODELS.cranes?.stsCrane ?? ASSETS_MODELS.cranes?.mcCrane,
    YGCrane:  ASSETS_MODELS.cranes?.ygcCrane ?? ASSETS_MODELS.cranes?.mcCrane,
    MCrane:   ASSETS_MODELS.cranes?.mcCrane,
    Truck:    ASSETS_MODELS.vehicles?.truck ?? ASSETS_MODELS.vehicles?.truckCarrier,
    Forklift: ASSETS_MODELS.vehicles?.forklift,
    RStacker: ASSETS_MODELS.props?.cone,           // placeholder até teres modelo
    SCarrier: ASSETS_MODELS.vehicles?.truckCarrier,
    TugBoat:  ASSETS_MODELS.vessels?.tugBoat,
    Other:    ASSETS_MODELS.props?.cone,
};

/** Dimensões-alvo (em metros) por tipo — heurísticas industriais */
export const TYPE_FOOTPRINT: Record<PType, { L: number; W: number; H: number }> = {
    STSCrane: { L: 40, W: 14, H: 52 },
    YGCrane:  { L: 24, W: 10, H: 26 },
    MCrane:   { L: 14, W:  8, H: 18 },
    Truck:    { L: 16, W:  3.2, H:  4.2 },
    Forklift: { L: 16, W:  3.2, H:  4.2 },
    RStacker: { L:  8, W:  4, H:  6 },
    SCarrier: { L: 13, W:  6, H: 16 },
    TugBoat:  { L: 16, W:  6, H:  9 },
    Other:    { L:  8, W:  4, H:  6 },
};

/** <<< NOVO: para o placement saber o footprint do tipo >>> */
export function getResourceFootprint(type: string) {
    const key = (type as PType) ?? "Other";
    return TYPE_FOOTPRINT[key] ?? TYPE_FOOTPRINT.Other;
}

/* ================== Placeholder por tipo ================== */
function makePlaceholderForType(pt: PType, colorMat?: THREE.Material) {
    const mat = (colorMat as THREE.Material) ?? Materials.resource;

    switch (pt) {
        case "STSCrane":
        case "YGCrane":
        case "MCrane": {
            // torre simples + base
            const g = new THREE.Group();
            const core = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), mat);
            const foot = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 6), mat);
            core.position.y = 3;
            foot.position.y = 0.3;
            core.castShadow = core.receiveShadow = true;
            foot.castShadow = foot.receiveShadow = true;
            g.add(core, foot);
            return g;
        }
        case "Truck":
        case "RStacker":
        case "SCarrier": {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2.4), mat);
            body.position.y = 1;
            body.castShadow = body.receiveShadow = true;
            g.add(body);
            return g;
        }
        case "Forklift": {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.2), mat);
            body.position.y = 0.9;
            body.castShadow = body.receiveShadow = true;
            g.add(body);
            return g;
        }
        case "TugBoat": {
            const g = new THREE.Group();
            const hull = new THREE.Mesh(new THREE.CapsuleGeometry(3.5, 4, 4, 8), mat);
            hull.rotation.z = Math.PI / 2;
            hull.position.y = 1.4;
            hull.castShadow = hull.receiveShadow = true;
            g.add(hull);
            return g;
        }
        default: {
            const sph = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), mat);
            sph.position.y = 1.5;
            sph.castShadow = sph.receiveShadow = true;
            return sph;
        }
    }
}

/* ================== Tint/opacity por estado ================== */
function applyStatusVfx(root: THREE.Object3D, status?: string) {
    const s = (status as PStatus) ?? "Available";
    if (s === "Available") return;

    const tint = s === "UnderMaintenance" ? 0xffcc00 : 0x777777;
    const opacity = s === "UnderMaintenance" ? 0.85 : 0.65;

    root.traverse((o: any) => {
        if (o.isMesh) {
            const m = o.material as THREE.MeshStandardMaterial;
            o.material = m.clone();
            if ("color" in o.material) {
                (o.material.color as THREE.Color).multiply(new THREE.Color(tint).convertSRGBToLinear());
            }
            o.material.transparent = opacity < 1;
            o.material.opacity = opacity;
            o.castShadow = true;
            o.receiveShadow = true;
        }
    });
}

/* ================== Normalização final do GLB ================== */
function normalizeLoadedModel(raw: THREE.Object3D, target: { L: number; W: number; H: number }) {
    const core = new THREE.Group();
    core.name = "PhysicalResource:core";
    core.add(raw);

    // sRGB fix
    core.traverse((o: any) => {
        if (o.isMesh) {
            const m = o.material;
            if (Array.isArray(m)) m.forEach(mm => { if (mm?.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
            else if (m?.map) m.map.colorSpace = THREE.SRGBColorSpace;
            o.castShadow = true;
            o.receiveShadow = true;
        }
    });

    alignLongestAxisToX(core);
    centerOnBottom(core);
    uniformScaleToFit(core, target.L, target.H, target.W);   // <<< uniforme
    centerOnBottom(core);

    return core;
}

/* ================== API pública ================== */
export function makePhysicalResource(r: PhysicalResourceDTO): THREE.Group {
    const pt = (r.physicalResourceType as PType) ?? "Other";
    const status = (r.physicalResourceStatus as PStatus) ?? "Available";
    const target = TYPE_FOOTPRINT[pt] ?? TYPE_FOOTPRINT.Other;

    const g = new THREE.Group();
    g.name = `PhysicalResource:${r.code ?? r.id ?? "?"}`;
    g.userData = {
        type: "PhysicalResource",
        id: r.id,
        label: r.code,
        prType: pt,
        status,
    };

    // Placeholder imediato normalizado ao footprint (com escala uniforme)
    const placeholder = makePlaceholderForType(pt, Materials.resource);
    const phWrap = new THREE.Group();
    phWrap.add(placeholder);
    alignLongestAxisToX(phWrap);
    centerOnBottom(phWrap);
    uniformScaleToFit(phWrap, target.L, target.H, target.W); // <<< uniforme
    centerOnBottom(phWrap);
    applyStatusVfx(phWrap, status);
    phWrap.name = "PhysicalResource:placeholder";
    g.add(phWrap);

    // Posicionamento & rotação
    const x = Number(r.positionX) || 0;
    const yBase = normalizeBaseY(Number(r.positionY), target.H);
    const z = Number(r.positionZ) || 0;
    const rotY = Number((r as any).rotationY) || 0;
    g.position.set(x, isFinite(yBase) ? yBase : 0, z);
    g.rotation.y = rotY;

    // Elevar ligeiramente para evitar z-fighting
    g.position.y += 0.02;

    // Carregar GLB e substituir placeholder
    (async () => {
        try {
            const url = TYPE_TO_MODEL[pt] || TYPE_TO_MODEL.Other!;
            if (!url) return; // se não houver modelo, mantém placeholder
            const raw = await loadGLB(url);
            const core = normalizeLoadedModel(raw, target);
            applyStatusVfx(core, status);

            g.remove(phWrap);
            core.name = "PhysicalResource:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha a carregar GLB de PhysicalResource:", pt, e);
            // mantém placeholder
        }
    })();

    return g;
}
