import * as THREE from "three";

export type DecorativeCraneNode = {
    dockId?: string | number;
    widthM: number;   // along X do chassis (rails)
    depthM: number;   // para dentro do cais (Z)
    heightM: number;  // altura total
    positionX: number;
    positionZ: number;
    rotationY: number;   
    childYaw?: number;   
};

const YELLOW = new THREE.MeshStandardMaterial({ color: 0xffd44d, metalness: 0.05, roughness: 0.9 });
const DARK   = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.2,  roughness: 0.8 });
const ORANGE = new THREE.MeshStandardMaterial({ color: 0xff6a2e, metalness: 0.2,  roughness: 0.7 });
const BLUE   = new THREE.MeshStandardMaterial({ color: 0x174a8a, metalness: 0.1,  roughness: 0.9 });

const LIFT_EPS = 0.02;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function box(w: number, h: number, d: number, mat: THREE.Material, name?: string) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (name) m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}
function cyl(r: number, h: number, mat: THREE.Material, name?: string) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), mat);
    if (name) m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}

/** Grua STS em primitivas com yaw do braço independente do chassis. */
export function makeDecorativeCrane(n: DecorativeCraneNode): THREE.Group {
    const W = Math.max(6, Number(n.widthM));
    const H = Math.max(12, Number(n.heightM));
    const D = Math.max(5, Number(n.depthM));

    // Grupo raiz (posição/rotação globais)
    const g = new THREE.Group();
    g.name = `DecorativeCrane:${n.dockId ?? "?"}`;
    g.userData = { type: "DecorativeCrane", dockId: n.dockId };
    g.position.set(Number(n.positionX) || 0, LIFT_EPS, Number(n.positionZ) || 0);
    g.rotation.y = Number(n.rotationY) || 0;

    // Grupo “chassis” (rails, pernas, viga) — segue a rotação do root
    const chassis = new THREE.Group();
    chassis.name = "chassis";
    g.add(chassis);

    // Grupo “boomPivot” (boom+contra-lança+trolley+cabos+contentor) — yaw relativo
    const boomPivot = new THREE.Group();
    boomPivot.name = "boomPivot";
    boomPivot.rotation.y = Number(n.childYaw || 0);
    g.add(boomPivot);

    // ==== proporções base
    const railGauge   = clamp(D * 0.75, 5, D * 0.9);
    const railThick   = clamp(D * 0.03, 0.22, 0.6);
    const railLen     = W * 0.86; 
    const legHeight   = clamp(H * 0.72, 8, H * 0.9);
    const girderY     = legHeight + H * 0.05;
    const girderThick = clamp(H * 0.04, 0.4, 1.4);
    const girderDepth = clamp(D * 0.42, 0.6, D * 0.7);
    const legThickX   = clamp(D * 0.085, 0.45, 1.6);
    const legThickZ   = clamp(D * 0.085, 0.45, 1.6);

    // ===== Rails
    const railL = box(railLen, railThick, railThick, DARK, "railL");
    railL.position.set(0, railThick / 2, -railGauge / 2);
    const railR = box(railLen, railThick, railThick, DARK, "railR");
    railR.position.set(0, railThick / 2, +railGauge / 2);
    chassis.add(railL, railR);

    // ===== Pernas (4)
    const legX = clamp(W * 0.38, 2, W * 0.45);
    const legZ = railGauge / 2 - legThickZ / 2;
    const yLeg = legHeight / 2 + railThick;
    [[+legX,+legZ],[-legX,+legZ],[+legX,-legZ],[-legX,-legZ]].forEach(([x,z],i)=>{
        const L = box(legThickX, legHeight, legThickZ, YELLOW, `leg${i}`);
        L.position.set(x, yLeg, z);
        chassis.add(L);
    });

    // ===== Girder
    const girder = box(W * 0.98, girderThick, girderDepth, YELLOW, "girder");
    girder.position.set(0, girderY + girderThick / 2 + railThick, 0);
    chassis.add(girder);

    // ===== Diagonais (mais discretas)
    const diagY = (girder.position.y + yLeg) / 2;
    const diagLenX = clamp(W * 0.22, 0.8, W * 0.35);
    const diagT = legThickZ * 0.30;
    const ang = Math.PI / 10;
    const offX = W * 0.16;
    const mkDiag = (rotZ: number) => { const d = box(diagLenX, diagT, diagT, YELLOW); d.rotation.z = rotZ; return d; };
    const d1 = mkDiag(-ang); d1.position.set(+offX, diagY, +legZ);
    const d2 = mkDiag(+ang); d2.position.set(-offX, diagY, +legZ);
    const d3 = mkDiag(-ang); d3.position.set(+offX, diagY, -legZ);
    const d4 = mkDiag(+ang); d4.position.set(-offX, diagY, -legZ);
    chassis.add(d1,d2,d3,d4);

    // ===== Boom & co. (no pivot)
    const boomLen   = clamp(D * 1.25, D * 0.9, D * 1.6);
    const boomThick = clamp(H * 0.045, 0.3, 1.2);
    const boom = box(boomThick, boomThick, boomLen, YELLOW, "boom");
    boom.position.set(0, girder.position.y + boomThick * 1.5, girderDepth/2 + boomLen/2);
    const tip = box(boomThick * 1.25, boomThick * 1.25, boomThick * 2.6, ORANGE, "boomTip");
    tip.position.set(0, 0, boomLen/2 - boomThick * 1.3);
    boom.add(tip);
    boomPivot.add(boom);

    const backLen = clamp(D * 0.45, 2, D * 0.7);
    const back = box(boomThick, boomThick, backLen, YELLOW, "backReach");
    back.position.set(0, boom.position.y, -(girderDepth/2 + backLen/2));
    boomPivot.add(back);

    const trolley = box(boomThick * 1.9, boomThick * 1.5, boomThick * 1.9, DARK, "trolley");
    trolley.position.set(0, boom.position.y - boomThick * 0.7, boom.position.z - boomLen * 0.33);
    boomPivot.add(trolley);

    const cableH = clamp(H * 0.28, 2, H * 0.45);
    const cableR = clamp(boomThick * 0.12, 0.05, 0.25);
    const cL = cyl(cableR, cableH, DARK, "cableL"); cL.rotation.x = Math.PI/2;
    const cR = cyl(cableR, cableH, DARK, "cableR"); cR.rotation.x = Math.PI/2;
    const cabZ = trolley.position.z;
    const cabY = trolley.position.y - cableH / 2 - boomThick * 0.2;
    const cabOffX = clamp(boomThick * 0.85, 0.5, 2.0);
    cL.position.set(-cabOffX, cabY, cabZ);
    cR.position.set(+cabOffX,  cabY, cabZ);
    boomPivot.add(cL, cR);

    const contW = clamp(boomThick * 2.4, 1.4, 3.0);
    const contH = clamp(boomThick * 1.4, 1.0, 2.0);
    const contD = contW * 2.4;
    const container = box(contW, contH, contD, BLUE, "container");
    container.position.set(0, cabY - cableH / 2 - contH / 2, cabZ);
    boomPivot.add(container);

    // Guarda-corpos
    const guardTh = clamp(boomThick * 0.22, 0.08, 0.25);
    const guardH  = clamp(H * 0.07, 1.0, 2.2);
    const guardLen = W * 0.96;
    const guardL = box(guardLen, guardH, guardTh, DARK, "guardL");
    const guardR = guardL.clone();
    guardL.position.set(0, girder.position.y + guardH / 2, +legZ + guardTh);
    guardR.position.set(0, girder.position.y + guardH / 2, -legZ - guardTh);
    chassis.add(guardL, guardR);

    return g;
}
