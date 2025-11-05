import * as THREE from "three";
import type { StorageAreaDto } from "../../types";
import { Materials } from "../Materials";
import { finite, safeSize } from "../utils/num";

export function makeStorageArea(sa: StorageAreaDto): THREE.Mesh {
    const W = safeSize(sa.widthM,  2, 10);
    const H = safeSize(sa.heightM, 1,  3);
    const D = safeSize(sa.depthM,  2, 10);
    
    const geom = new THREE.BoxGeometry(W, H, D);
    const mesh = new THREE.Mesh(geom, Materials.storage);
    
    
    mesh.position.set(finite(sa.positionX, 0), H / 2, finite(sa.positionZ, 0));
    mesh.userData = { type: "StorageArea", id: sa.id, label: sa.name };
    
    return mesh;
}
