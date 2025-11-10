// src/features/viewer3d/scene/objects/DecorativeCrane.ts
import * as THREE from "three";

export type DecorativeCraneNode = {
    dockId?: string | number;
    widthM: number;
    depthM: number;
    heightM: number;
    positionX: number;
    positionZ: number;
    rotationY: number;
};

const MAT = new THREE.MeshStandardMaterial({
    color: 0xffd44d, // amarelo “warning”
    metalness: 0.05,
    roughness: 0.9,
});

const LIFT_EPS = 0.02; // evita z-fighting com o deck

/** Grua decorativa simplificada (paralelepípedo alto). */
export function makeDecorativeCrane(n: DecorativeCraneNode): THREE.Mesh {
    const w = Math.max(0.2, Number(n.widthM));
    const h = Math.max(0.2, Number(n.heightM));
    const d = Math.max(0.2, Number(n.depthM));

    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, MAT);

    mesh.position.set(Number(n.positionX) || 0, h / 2 + LIFT_EPS, Number(n.positionZ) || 0);
    mesh.rotation.y = Number(n.rotationY) || 0;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `DecorativeCrane:${n.dockId ?? "?"}`;
    mesh.userData = { type: "DecorativeCrane", dockId: n.dockId };

    return mesh;
}
