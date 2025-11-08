import * as THREE from "three";
import type { VesselDto } from "../../types";
import { loadGLB } from "../utils/loader";
import { recenterPivot } from "../utils/center";

function safeSize(n: any, min: number, fallback: number) {
    const v = Number(n);
    return Math.max(min, Number.isFinite(v) ? v : fallback);
}
function finite(n: any, fallback: number) {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
}
function scaleToLengthX(obj: THREE.Object3D, targetL: number) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(); box.getSize(size);
    const factor = targetL / (size.x || 1);
    if (Number.isFinite(factor) && factor > 0) obj.scale.multiplyScalar(factor);
}

/** Placeholder enquanto o GLB carrega */
export function makeVesselPlaceholder(v: VesselDto): THREE.Mesh {
    const L = safeSize(v.lengthMeters, 20, 70);
    const W = safeSize(v.widthMeters,  6,  18);
    const H = safeSize((v.draftMeters ?? 7) + 5, 5, 12);

    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x2e8197, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);

    mesh.position.set(finite(v.positionX, 0), H / 2, finite(v.positionZ, 0));
    mesh.rotation.y = Number((v as any).rotationY) || 0;
    mesh.userData = { type: "Vessel", id: v.id, label: `${v.name} (${v.imoNumber})` };
    return mesh;
}

export async function makeVesselNode(
    v: VesselDto,
    assetPath: string,
    texturePath: string | null,
    scaleMeters = 1
): Promise<THREE.Object3D> {
    const raw = await loadGLB(assetPath);
    const obj = recenterPivot(raw);

    const targetL = safeSize((v as any).lengthMeters, 20, 70);
    scaleToLengthX(obj, targetL);
    if (scaleMeters !== 1) obj.scale.multiplyScalar(scaleMeters);

    if (texturePath) {
        try {
            const tex = await new THREE.TextureLoader().loadAsync(texturePath);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 1);
            obj.traverse((o: any) => {
                if (o.isMesh) {
                    o.castShadow = true; o.receiveShadow = true;
                    const mat = o.material;
                    if (Array.isArray(mat)) {
                        mat.forEach((m: any) => { if (m && "map" in m) { m.map = tex; m.needsUpdate = true; } });
                    } else if (mat && "map" in mat) {
                        (mat as any).map = tex; (mat as any).needsUpdate = true;
                    }
                }
            });
        } catch (e) {
            console.warn("Falha a carregar textura do navio:", e);
        }
    }
    return obj;
}
