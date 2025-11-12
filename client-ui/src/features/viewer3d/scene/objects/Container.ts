import * as THREE from "three";
import type { ContainerDto } from "../../types";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLB } from "../utils/loader";

/* ===================== BBox helpers ===================== */
function getSize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    return { box, size };
}

/* ========== Base @ y=0 (centro da base na origem) ========= */
function centerOnBottom(obj: THREE.Object3D) {
    const { box } = getSize(obj);
    const center = box.getCenter(new THREE.Vector3());
    const pivot = new THREE.Vector3(center.x, box.min.y, center.z);
    obj.position.sub(pivot);
}

/* ========== Alinhar comprimento no +X (se vier no Z) ====== */
function alignLongestAxisToX(obj: THREE.Object3D) {
    const { size } = getSize(obj);
    if (size.z > size.x) obj.rotateY(Math.PI / 2);
}

/* =================== Escalar para L/H/W =================== */
function fitToSize(obj: THREE.Object3D, L: number, H: number, W: number) {
    const { size } = getSize(obj);
    const sx = L / (size.x || 1);
    const sy = H / (size.y || 1);
    const sz = W / (size.z || 1);
    obj.scale.set(sx, sy, sz);
}

/* =================== Placeholder (liso) =================== */
function makePlainMaterial(paintColor?: number) {
    return new THREE.MeshStandardMaterial({
        color: paintColor ?? 0x9aa3ad,
        metalness: 0.2,
        roughness: 0.8,
    });
}
function makeContainerPlaceholderBox(L: number, H: number, W: number, paintColor?: number) {
    const geom = new THREE.BoxGeometry(L, H, W); // centrado na origem
    const mat = makePlainMaterial(paintColor);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Container:placeholder";
    // sobe H/2 localmente: base do placeholder passa a y=0
    mesh.position.y = H / 2;
    return mesh;
}

/* ============= Escolha determinística 1..3 =============== */
function pickIndex3(key: string): number {
    let h = 5381;
    for (let i = 0; i < key.length; i++) h = ((h << 5) + h) + key.charCodeAt(i);
    return Math.abs(h) % 3;
}
function pickContainerModel(c: ContainerDto): string {
    const key = String(c.id ?? c.isoCode ?? "");
    const models = [
        ASSETS_MODELS.containers.container,
        ASSETS_MODELS.containers.container2,
        ASSETS_MODELS.containers.containerRealistic,
    ];
    return models[pickIndex3(key)];
}

/* ======== Normalização completa do GLB (base/escala) ====== */
function normalizeContainerModel(
    raw: THREE.Object3D,
    L: number, H: number, W: number,
    paintColor?: number
) {
    const core = new THREE.Group();
    core.name = "Container:core";
    core.add(raw);

    core.traverse((o: any) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const m = o.material;
            if (Array.isArray(m)) m.forEach(mm => { if (mm?.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
            else if (m?.map) m.map.colorSpace = THREE.SRGBColorSpace;

            if (paintColor != null && m && "color" in m) {
                (m.color as THREE.Color).setHex(paintColor);
            }
        }
    });

    alignLongestAxisToX(core);
    centerOnBottom(core);
    fitToSize(core, L, H, W);
    centerOnBottom(core); // recentrar após escala

    return core;
}

/* ======== Converter Y recebido (centro → base se preciso) ======== */
function normalizeBaseY(yRaw: number, H: number): number {
    if (!isFinite(yRaw)) return 0;
    const eps = 0.05 * H; // tolerância 5%
    const mod = ((yRaw % H) + H) % H;
    if (Math.abs(yRaw - H / 2) < eps || Math.abs(mod - H / 2) < eps) {
        return yRaw - H / 2; // veio do centro passa para base
    }
    return yRaw; 
}

/* ======================= API pública ====================== */
export function makeContainerPlaceholder(
    c: ContainerDto,
    scaleMeters = 1,
    paintColor?: number
): THREE.Group {
    const is40 = String(c.type ?? "").toLowerCase().includes("40");
    const L = (is40 ? 12.19 : 6.06) * scaleMeters; // X (comprimento)
    const H =  2.59 * scaleMeters;                 // Y (altura)
    const W =  2.44 * scaleMeters;                 // Z (largura)

    // Invólucro externo — mantém API/posições
    const g = new THREE.Group();
    g.name = `Container:${c.isoCode ?? c.id ?? "?"}`;
    g.userData = {
        type: "Container",
        id: c.id,
        label: c.isoCode ?? "Container",
        isoCode: c.isoCode,
        containerType: c.type,
        status: c.status,
        weightKg: (c as any).weightKg ?? 0,
        is40,
        scaleMeters,
    };

    // Placeholder já com base a y=0
    const ph = makeContainerPlaceholderBox(L, H, W, paintColor);
    g.add(ph);

    // Posicionamento/rotação — Y interpretado como BASE (com auto-fix)
    const x = Number((c as any).positionX) || 0;
    const yRaw = Number((c as any).positionY);
    const yBase = normalizeBaseY(yRaw, H);
    const z = Number((c as any).positionZ) || 0;

    g.position.set(x, isFinite(yBase) ? yBase : 0, z);
    g.rotation.y = Number((c as any).rotationY) || 0;



    // Carregar 1 dos 3 modelos e substituir
    (async () => {
        try {
            const url = pickContainerModel(c);
            const raw = await loadGLB(url);
            const core = normalizeContainerModel(raw, L, H, W, paintColor);

            g.remove(ph);
            core.name = "Container:model";
            g.add(core);
        } catch (e) {
            console.warn("Falha a carregar GLB de contentor:", e);
        }
    })();

    return g;
}
