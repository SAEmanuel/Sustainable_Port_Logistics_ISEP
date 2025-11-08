import * as THREE from "three";
import type { DockDto } from "../../types";
import { loadGLB } from "../utils/loader";
import { finite, safeSize } from "../utils/num";
import { recenterPivot } from "../utils/center";

function scaleToLengthX(obj: THREE.Object3D, targetL: number) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(); box.getSize(size);
    const current = size.x || 1;
    const k = targetL / current;
    if (Number.isFinite(k) && k > 0) obj.scale.multiplyScalar(k);
}

/** Placeholder enquanto o GLB do dock carrega */
export function makeDockPlaceholder(d: DockDto): THREE.Mesh {
    const L = safeSize(d.lengthM, 5, 80);
    const W = safeSize(d.depthM,  3, 15);
    const H = safeSize(d.maxDraftM, 1, 6);

    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x6e7a86, metalness: 0.1, roughness: 0.9 });
    const mesh = new THREE.Mesh(geom, mat);

    mesh.position.set(finite(d.positionX, 0), H / 2, finite(d.positionZ, 0));
    mesh.rotation.y = Number((d as any).rotationY) || 0;
    mesh.userData = { type: "Dock", id: d.id, label: d.code };
    return mesh;
}

/** Carrega o GLB do dock e ajusta a escala ao comprimento (eixo X) */
export async function makeDockNode(d: DockDto, assetPath: string): Promise<THREE.Object3D> {
    const raw = await loadGLB(assetPath);
    const obj = recenterPivot(raw);
    const L = safeSize(d.lengthM, 5, 80);
    scaleToLengthX(obj, L);

    obj.traverse((o: any) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });

    return obj;
}
