import * as THREE from "three";
import type { PhysicalResourceDTO } from "../../types";
import { Materials } from "../Materials";

export function makePhysicalResource(r: PhysicalResourceDTO): THREE.Mesh {
    const geom = new THREE.SphereGeometry(2, 16, 16);
    const mesh = new THREE.Mesh(geom, Materials.resource);
    
    const x = Number(r.positionX) || 0;
    const z = Number(r.positionZ) || 0;
    
    mesh.position.set(x, 2, z);
    mesh.userData = { type: "PhysicalResource", id: r.id, label: r.code };
    
    return mesh;
}
