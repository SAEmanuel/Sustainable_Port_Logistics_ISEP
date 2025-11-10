// src/features/viewer3d/scene/utils/loadGLBNormalized.ts
import * as THREE from "three";
import { loadGLB } from "./loader"; // ← o ficheiro que tu mostraste

export type NormalizeOpts = {
    centerXZ?: boolean;   // recentrar no plano XZ (default true)
    baseY0?: boolean;     // “assentar” a base em y=0 (default true)
};

export async function loadGLBNormalized(url: string, opts: NormalizeOpts = {}) {
    const { centerXZ = true, baseY0 = true } = opts;
    const obj = await loadGLB(url);        // usa o teu cache/DRACO

    // Mede AABB
    const box = new THREE.Box3().setFromObject(obj);
    const ctr = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;

    // Recentra X/Z e assenta base
    if (centerXZ) {
        obj.position.x -= ctr.x;
        obj.position.z -= ctr.z;
    }
    if (baseY0) {
        obj.position.y -= minY; // agora o ponto mais baixo fica em y=0
    }

    return obj;
}
