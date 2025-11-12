import * as THREE from "three";
import { loadGLB } from "./loader"; 

export type NormalizeOpts = {
    centerXZ?: boolean;   
    baseY0?: boolean;     
};

export async function loadGLBNormalized(url: string, opts: NormalizeOpts = {}) {
    const { centerXZ = true, baseY0 = true } = opts;
    const obj = await loadGLB(url);      

  
    const box = new THREE.Box3().setFromObject(obj);
    const ctr = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;

    
    if (centerXZ) {
        obj.position.x -= ctr.x;
        obj.position.z -= ctr.z;
    }
    if (baseY0) {
        obj.position.y -= minY; 
    }

    return obj;
}
