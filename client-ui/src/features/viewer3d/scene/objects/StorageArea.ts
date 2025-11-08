import * as THREE from "three";
import type { StorageAreaDto } from "../../types";
import { Materials } from "../Materials";
import { loadGLB } from "../utils/loader";

function scaleToFit(obj: THREE.Object3D, W: number, H: number, D: number) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(); box.getSize(size);
    const sx = W / (size.x || 1);
    const sy = H / (size.y || 1);
    const sz = D / (size.z || 1);
    const k = Math.min(sx, sy, sz);
    if (Number.isFinite(k) && k > 0) obj.scale.multiplyScalar(k);
}

export function makeStorageAreaPlaceholder(sa: StorageAreaDto): THREE.Object3D {
    const W = Math.max(2, Number(sa.widthM)  || 10);
    const H = Math.max(1, Number(sa.heightM) ||  3);
    const D = Math.max(2, Number(sa.depthM)  || 10);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), Materials.storage);
    mesh.castShadow = false; mesh.receiveShadow = true;

    const x = Number(sa.positionX) || 0;
    const y = (Number(sa.positionY) || 0);
    const z = Number(sa.positionZ) || 0;
    mesh.position.set(x, y, z);

    mesh.userData = { type: "StorageArea", id: sa.id, label: sa.name };
    return mesh;
}

export async function makeStorageAreaNode(sa: StorageAreaDto, assetPath?: string): Promise<THREE.Object3D> {
    const W = Math.max(2, Number(sa.widthM)  || 10);
    const H = Math.max(1, Number(sa.heightM) ||  3);
    const D = Math.max(2, Number(sa.depthM)  || 10);

    if (assetPath) {
        const obj = await loadGLB(assetPath);
        scaleToFit(obj, W, H, D);
        return obj;
    }

    const group = new THREE.Group();

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.15, D),
        new THREE.MeshStandardMaterial({ color: 0xdee3ea, metalness: 0.1, roughness: 0.9 })
    );
    floor.position.set(0, -(H / 2) + 0.075, 0);
    floor.receiveShadow = true;
    group.add(floor);

    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
        new THREE.LineBasicMaterial({})
    );
    group.add(edges);

    const grid = new THREE.GridHelper(Math.max(W, D), Math.max(Math.round(W / 2), Math.round(D / 2)));
    grid.rotation.x = Math.PI / 2;
    group.add(grid);

    return group;
}
