import * as THREE from "three";
import type { DockDto } from "../../types";

/** Tipos utilitários iguais aos do portGrids.ts */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Grid = { rect: Rect; rows: number; cols: number };
export type GridsResult = {
    C: Record<`C.${1|2|3|4|5|6|7|8|9|10}`, Grid>;
    A: { "A.1": Grid; "A.2": Grid };
    B: { "B.1": Grid; "B.2": Grid };
};

/** Dock a renderizar (permite rotationY opcional só para o cliente) */
export type DockRender = DockDto & { rotationY?: number };

/** Placeholder/GLB-host para a Dock */
export function makeDock(d: DockRender): THREE.Mesh {
    const L = Math.max(1, Number(d.lengthM)   || 20);
    const W = Math.max(1, Number(d.depthM)    || 12);
    const H = Math.max(1, Number(d.maxDraftM) || 5);

    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x6e7a86, metalness: 0.15, roughness: 0.9 });
    const m = new THREE.Mesh(geom, mat);
    m.castShadow = true; m.receiveShadow = true;

    const x = Number(d.positionX) || 0;
    const z = Number(d.positionZ) || 0;
    const rotY = Number(d.rotationY ?? 0);

    // base assenta no chão
    m.position.set(x, H / 2, z);
    m.rotation.y = rotY;

    m.userData = { type: "Dock", id: d.id, label: d.code };
    return m;
}
