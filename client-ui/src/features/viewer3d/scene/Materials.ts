import * as THREE from "three";

export const Materials = {
    dock:       new THREE.MeshStandardMaterial({ color: 0x9bb1ff, metalness: 0.1, roughness: 0.8 }),
    storage:    new THREE.MeshStandardMaterial({ color: 0xbfe9a5, metalness: 0.1, roughness: 0.8 }),
    vessel:     new THREE.MeshStandardMaterial({ color: 0x2e8197, metalness: 0.2, roughness: 0.6 }),
    container:  new THREE.MeshStandardMaterial({ color: 0xd0a06f, metalness: 0.1, roughness: 0.8 }),
    resource:   new THREE.MeshStandardMaterial({ color: 0x7e6bb6, metalness: 0.1, roughness: 0.8 }),
};
