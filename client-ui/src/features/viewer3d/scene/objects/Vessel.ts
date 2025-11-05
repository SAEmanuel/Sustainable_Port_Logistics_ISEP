import * as THREE from "three";
import type { VesselDto } from "../../types";
import { Materials } from "../Materials";
import { safeSize, finite } from "../utils/num";

export function makeVessel(v: VesselDto): THREE.Mesh {
    const L = safeSize(v.lengthMeters, 20, 140);
    const W = safeSize(v.widthMeters,   6,  22);
    const H = safeSize((v.draftMeters ?? 7) + 5, 5, 12);
    
    const geom = new THREE.BoxGeometry(L, H, W);
    const mesh = new THREE.Mesh(geom, Materials.vessel);
    
    
    mesh.position.set(finite(v.positionX, 0), H / 2, finite(v.positionZ, 0));
    mesh.rotation.y = Math.PI * 0.25;
    mesh.userData = { type: "Vessel", id: v.id, label: `${v.name} (${v.imoNumber})` };
    
    return mesh;
}
