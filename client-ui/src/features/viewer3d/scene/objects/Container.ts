import * as THREE from "three";
import type { ContainerDto } from "../../types";
import { loadGLB } from "../utils/loader";
import { recenterPivot } from "../utils/center";

function scaleToLengthX(obj: THREE.Object3D, targetL: number) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(); box.getSize(size);
    const k = targetL / (size.x || 1);
    if (Number.isFinite(k) && k > 0) obj.scale.multiplyScalar(k);
}

/** Placeholder */
export function makeContainerPlaceholder(c: ContainerDto): THREE.Mesh {
    const L = 6.06, H = 2.59, W = 2.44;
    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.2, roughness: 0.7 });
    const mesh = new THREE.Mesh(geom, mat);

    const x = Number(c.positionX) || 0;
    const y = (Number(c.positionY) || 0) + H / 2;
    const z = Number(c.positionZ) || 70;

    mesh.position.set(x, y, z);
    mesh.rotation.y = Number((c as any).rotationY) || 0;
    mesh.userData = { type: "Container", id: c.id, label: c.isoCode ?? "Container" };
    return mesh;
}

export async function makeContainerNode(
    c: ContainerDto,
    assetPath?: string,
    texturePath: string | null = null,
    scaleMeters = 1
): Promise<THREE.Object3D> {
    let raw: THREE.Object3D;
    if (assetPath) {
        raw = await loadGLB(assetPath);
    } else {
        raw = new THREE.Mesh(new THREE.BoxGeometry(6.06, 2.59, 2.44),
            new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.2, roughness: 0.7 }));
    }

    const obj = recenterPivot(raw);
    const is40 = String(c.type ?? "").toLowerCase().includes("40");
    const targetL = is40 ? 12.19 : 6.06;
    scaleToLengthX(obj, targetL);
    if (scaleMeters !== 1) obj.scale.multiplyScalar(scaleMeters);

    if (texturePath) {
        try {
            const tex = await new THREE.TextureLoader().loadAsync(texturePath);
            tex.colorSpace = THREE.SRGBColorSpace;
            obj.traverse((o: any) => {
                if (o.isMesh && o.material && "map" in o.material) {
                    o.material.map = tex; o.material.needsUpdate = true;
                }
            });
        } catch (e) {
            console.warn("Falha a carregar textura do contentor:", e);
        }
    }

    return obj;
}
