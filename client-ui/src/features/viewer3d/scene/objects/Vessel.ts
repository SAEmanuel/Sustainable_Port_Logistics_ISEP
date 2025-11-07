import * as THREE from "three";
import type { VesselDto } from "../../types";
import { loadGLB } from "../utils/loader";

function safeSize(n: any, min: number, fallback: number) {
    const v = Number(n);
    return Math.max(min, Number.isFinite(v) ? v : fallback);
}
function finite(n: any, fallback: number) {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
}

/** Escala o objeto para ter o comprimento `targetL` no eixo X */
function scaleToLengthX(obj: THREE.Object3D, targetL: number) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(); box.getSize(size);
    const current = size.x || 1;                 // assume comprimento no eixo X
    const factor = targetL / current;
    if (Number.isFinite(factor) && factor > 0) obj.scale.multiplyScalar(factor);
}

/** Placeholder enquanto o GLB carrega (sem alterações) */
export function makeVesselPlaceholder(v: VesselDto): THREE.Mesh {
    const L = safeSize(v.lengthMeters, 20, 140);
    const W = safeSize(v.widthMeters,   6,  22);
    const H = safeSize((v.draftMeters ?? 7) + 5, 5, 12);

    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x2e8197, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);

    mesh.position.set(finite(v.positionX, 0), H / 2, finite(v.positionZ, 0));
    mesh.rotation.y = Math.PI * 0.25;
    mesh.userData = { type: "Vessel", id: v.id, label: `${v.name} (${v.imoNumber})` };
    return mesh;
}

export async function makeVesselNode(v: VesselDto, assetPath: string, texturePath: string | null, scaleMeters = 1): Promise<THREE.Object3D> {
    const obj = await loadGLB(assetPath);

    // Escala pelo comprimento (opcional)
    const targetL = safeSize((v as any).lengthMeters, 20, 30);
    scaleToLengthX(obj, targetL);
    if (scaleMeters !== 1) obj.scale.multiplyScalar(scaleMeters);

    // Materiais/texture (sem mexer em pose/userData)
    if (texturePath) {
        try {
            const tex = await new THREE.TextureLoader().loadAsync(texturePath);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 1);

            obj.traverse((o: any) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    const mat = o.material;
                    if (Array.isArray(mat)) {
                        mat.forEach((m: any) => {
                            if (m && "map" in m) { m.map = tex; m.needsUpdate = true; }
                        });
                    } else if (mat && "map" in mat) {
                        (mat as any).map = tex;
                        (mat as any).needsUpdate = true;
                    }
                }
            });
        } catch (e) {
            console.warn("Falha a carregar textura do navio:", e);
        }
    }

    return obj;
}