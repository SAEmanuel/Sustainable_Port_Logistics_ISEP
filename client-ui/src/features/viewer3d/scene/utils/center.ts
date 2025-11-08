import * as THREE from "three";

/** Empacota o objeto num Group e move o conteúdo para que o centro do bbox fique na origem */
export function recenterPivot(raw: THREE.Object3D) {
    const wrapper = new THREE.Group();
    wrapper.add(raw);
    const box = new THREE.Box3().setFromObject(raw);
    const c = new THREE.Vector3();
    box.getCenter(c);
    raw.position.sub(c);
    raw.updateMatrixWorld(true);
    return wrapper;
}
