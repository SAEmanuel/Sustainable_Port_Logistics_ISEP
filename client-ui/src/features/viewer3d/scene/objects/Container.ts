import * as THREE from "three";
import type { ContainerDto } from "../../types";
import { Materials } from "../Materials";

export function makeContainer(c: ContainerDto): THREE.Mesh {
    // 1x TEU aprox: 6.06 x 2.59 x 2.44
    
    const geom = new THREE.BoxGeometry(6.06, 2.59, 2.44);
    const mesh = new THREE.Mesh(geom, Materials.container);
    
    const x = Number(c.positionX) || 0;
    const y = (Number(c.positionY) || 0) + 2.59 / 2;
    const z = Number(c.positionZ) || 0;
    
    mesh.position.set(x, y, z);
    mesh.userData = { type: "Container", id: c.id, label: c.isoCode };
    
    return mesh;
}
