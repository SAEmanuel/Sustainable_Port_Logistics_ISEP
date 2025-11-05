import * as THREE from "three";
import type { DockDto } from "../../types";
import { Materials } from "../Materials";
import { finite, safeSize } from "../utils/num";

export function makeDock(d: DockDto): THREE.Mesh {
    const L = safeSize(d.lengthM,   5, 80);
    const W = safeSize(d.depthM,    3, 15);
    const H = safeSize(d.maxDraftM, 1,  6);
    
    const geom = new THREE.BoxGeometry(L, H, W);
    const mesh = new THREE.Mesh(geom, Materials.dock);
    
    mesh.position.set(finite(d.positionX, 0), H / 2, finite(d.positionZ, 0));
    mesh.userData = { type: "Dock", id: d.id, label: d.code };
    
    return mesh;
}
