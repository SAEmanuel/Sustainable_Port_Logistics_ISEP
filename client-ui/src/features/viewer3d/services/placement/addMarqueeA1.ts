// src/features/viewer3d/services/placement/addModernAwningsA1.ts
import * as THREE from "three";
import type { GridsResult, Rect } from "../../scene/objects/portGrids";

export type ModernAwningOpts = {
    zone?: "A.1";
    roadY?: number;

    marginX?: number;
    marginZ?: number;
    fillWidthRatio?: number;
    fillDepthRatio?: number;
    gapBetween?: number;

    overhangX?: number;
    overhangZ?: number;
    eaveHeight?: number;       // altura nos beirais (postes)
    ridgeExtra?: number;       // quanto a cumeeira sobe acima do beiral

    postRadius?: number;
    beamRadius?: number;
    finishBarRadius?: number;

    colorFrame?: number;
    colorFabric?: number;
    fabricOpacity?: number;
    softEdges?: boolean;
};

const DEF: Required<ModernAwningOpts> = {
    zone: "A.1",
    roadY: 0.03,
    marginX: 6,
    marginZ: 6,
    fillWidthRatio: 0.90,
    fillDepthRatio: 0.64,
    gapBetween: 6,

    overhangX: 0.7,
    overhangZ: 0.7,
    eaveHeight: 6.6,
    ridgeExtra: 2.4,

    postRadius: 0.20,
    beamRadius: 0.14,
    finishBarRadius: 0.10,

    colorFrame: 0x707881,
    colorFabric: 0xffffff,   // teto branco translúcido por omissão
    fabricOpacity: 0.85,
    softEdges: true,
};

function subRectCentered(r: Rect, wRatio: number, dRatio: number, mX: number, mZ: number): Rect {
    const inner: Rect = {
        minX: r.minX + mX, maxX: r.maxX - mX,
        minZ: r.minZ + mZ, maxZ: r.maxZ - mZ,
    };
    const iw = inner.maxX - inner.minX;
    const id = inner.maxZ - inner.minZ;
    const w = iw * THREE.MathUtils.clamp(wRatio, 0.05, 1);
    const d = id * THREE.MathUtils.clamp(dRatio, 0.05, 1);
    const cx = (inner.minX + inner.maxX) / 2;
    const cz = (inner.minZ + inner.maxZ) / 2;
    return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}

function makePost(h: number, r: number, color: number) {
    const g = new THREE.CylinderGeometry(r, r, h, 24);
    const m = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.55 });
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.y = h / 2;
    return mesh;
}

function makeTube(p0: THREE.Vector3, p1: THREE.Vector3, r: number, color: number) {
    const dir = new THREE.Vector3().subVectors(p1, p0);
    const len = dir.length();
    const g = new THREE.CylinderGeometry(r, r, len, 20);
    const m = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.55 });
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    mesh.position.copy(p0.clone().addScaledVector(dir, 0.5));
    return mesh;
}

function makeFabricShape(w: number, d: number, rounded = true) {
    if (!rounded) return new THREE.PlaneGeometry(w, d);
    const r = Math.min(w, d) * 0.06;
    const s = new THREE.Shape();
    s.moveTo(-w/2 + r, -d/2);
    s.lineTo(w/2 - r, -d/2);
    s.quadraticCurveTo(w/2, -d/2, w/2, -d/2 + r);
    s.lineTo(w/2, d/2 - r);
    s.quadraticCurveTo(w/2, d/2, w/2 - r, d/2);
    s.lineTo(-w/2 + r, d/2);
    s.quadraticCurveTo(-w/2, d/2, -w/2, d/2 - r);
    s.lineTo(-w/2, -d/2 + r);
    s.quadraticCurveTo(-w/2, -d/2, -w/2 + r, -d/2);
    return new THREE.ShapeGeometry(s, 16);
}

function makeFabricMesh(w: number, d: number, color: number, opacity: number, rounded: boolean) {
    const geom = makeFabricShape(w, d, rounded);
    const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0,
        roughness: 1,
        transparent: opacity < 1,
        opacity,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
}

function buildAwningModule(rect: Rect, y0: number, O: Required<ModernAwningOpts>) {
    const G = new THREE.Group();

    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;

    const hEave = O.eaveHeight;
    const eaveY = y0 + hEave;

    const leftX  = rect.minX;
    const rightX = rect.maxX;
    const midZ   = (rect.minZ + rect.maxZ) / 2;
    const cx     = (rect.minX + rect.maxX) / 2;

    // postes laterais
    const postL = makePost(hEave, O.postRadius, O.colorFrame);
    postL.position.set(leftX, y0 + hEave/2, midZ);
    const postR = makePost(hEave, O.postRadius, O.colorFrame);
    postR.position.set(rightX, y0 + hEave/2, midZ);
    G.add(postL, postR);

    // beirais (vigas topo dos postes, paralelas ao Z)
    const topL1 = new THREE.Vector3(leftX,  eaveY, rect.minZ);
    const topL2 = new THREE.Vector3(leftX,  eaveY, rect.maxZ);
    const topR1 = new THREE.Vector3(rightX, eaveY, rect.minZ);
    const topR2 = new THREE.Vector3(rightX, eaveY, rect.maxZ);
    G.add(
        makeTube(topL1, topL2, O.beamRadius, O.colorFrame),
        makeTube(topR1, topR2, O.beamRadius, O.colorFrame)
    );

// cumeeira COM A MESMA INCLINAÇÃO DOS PANOS
    const ridgeY = eaveY + O.ridgeExtra;

    const halfCore = d / 2;                  // distância centro→beiral (sem overhang)
    const halfSpan = halfCore + O.overhangZ; // centro→borda do pano
    const slopeYperZ = O.ridgeExtra / Math.max(halfCore, 1e-6);

// y nas pontas para igualar o declive dos panos
    let edgeY = ridgeY - slopeYperZ * halfSpan;
// não descer abaixo dos beirais
    edgeY = Math.max(eaveY, edgeY);

// esquerda (Z-)
    const ridgeLeft = makeTube(
        new THREE.Vector3(cx, ridgeY, midZ),                         // centro alto
        new THREE.Vector3(cx, edgeY, rect.minZ - O.overhangZ),       // ponta com a MESMA inclinação
        O.beamRadius * 1.1, O.colorFrame
    );

// direita (Z+)
    const ridgeRight = makeTube(
        new THREE.Vector3(cx, ridgeY, midZ),
        new THREE.Vector3(cx, edgeY, rect.maxZ + O.overhangZ),
        O.beamRadius * 1.1, O.colorFrame
    );

    G.add(ridgeLeft, ridgeRight);


    // CORREÇÃO: “corte ao meio” inclinado (centro alto -> beirais baixos)
    G.add(
        makeTube(new THREE.Vector3(cx, ridgeY, midZ), new THREE.Vector3(leftX  - O.overhangX, eaveY, midZ), O.beamRadius * 1.1, O.colorFrame),
        makeTube(new THREE.Vector3(cx, ridgeY, midZ), new THREE.Vector3(rightX + O.overhangX, eaveY, midZ), O.beamRadius * 1.1, O.colorFrame)
    );

    // escoras diagonais convergindo no centro alto
    G.add(
        makeTube(new THREE.Vector3(cx, ridgeY, midZ), new THREE.Vector3(leftX,  eaveY, midZ), O.beamRadius * 0.8, O.colorFrame),
        makeTube(new THREE.Vector3(cx, ridgeY, midZ), new THREE.Vector3(rightX, eaveY, midZ), O.beamRadius * 0.8, O.colorFrame)
    );

    // panos (duas águas) — base horizontal (XZ) + inclinação
    const planeW = w + 2 * O.overhangX;
    const halfD  = d/2 + O.overhangZ;
    const slope  = Math.atan2(O.ridgeExtra, d/2);

    const fabricLeft  = makeFabricMesh(planeW, halfD, O.colorFabric, O.fabricOpacity, O.softEdges);
    const fabricRight = makeFabricMesh(planeW, halfD, O.colorFabric, O.fabricOpacity, O.softEdges);

    // de XY para XZ e inclinações opostas
    fabricLeft.rotation.x  = -Math.PI/2 - slope;  // desce para -Z
    fabricRight.rotation.x = -Math.PI/2 + slope;  // desce para +Z

    const cz = (rect.minZ + rect.maxZ)/2;
    const cxMid = (rect.minX + rect.maxX)/2;
    fabricLeft.position.set(cxMid,  y0 + hEave + O.ridgeExtra/2, cz - halfD/2);
    fabricRight.position.set(cxMid, y0 + hEave + O.ridgeExtra/2, cz + halfD/2);

    G.add(fabricLeft, fabricRight);

    // barras de acabamento frontais/traseiras
    const frontBarL = new THREE.Vector3(rect.minX - O.overhangX, eaveY, rect.minZ - O.overhangZ);
    const frontBarR = new THREE.Vector3(rect.maxX + O.overhangX, eaveY, rect.minZ - O.overhangZ);
    const backBarL  = new THREE.Vector3(rect.minX - O.overhangX, eaveY, rect.maxZ + O.overhangZ);
    const backBarR  = new THREE.Vector3(rect.maxX + O.overhangX, eaveY, rect.maxZ + O.overhangZ);
    G.add(
        makeTube(frontBarL, frontBarR, O.finishBarRadius, O.colorFrame),
        makeTube(backBarL,  backBarR,  O.finishBarRadius, O.colorFrame)
    );

    // meta
    G.userData = { type: "ModernAwning", rect, ridgeY, eaveY };
    return G;
}

/** Cria dois toldos modernos na A.1, cada um ocupando ~metade da largura. */
export function addModernAwningsInA1(
    parent: THREE.Group,
    grids: GridsResult | null | undefined,
    userOpts: ModernAwningOpts = {}
) {
    if (!grids?.A?.["A.1"]) {
        console.warn("[modern-awning] A.1 não encontrada.");
        return new THREE.Group();
    }
    const O = { ...DEF, ...userOpts };
    const zone = grids.A["A.1"];
    const y0 = O.roadY;

    const baseRect = subRectCentered(zone.rect, O.fillWidthRatio, O.fillDepthRatio, O.marginX, O.marginZ);
    const w = baseRect.maxX - baseRect.minX;
    const d = baseRect.maxZ - baseRect.minZ;

    // dividir em dois módulos ao longo do X
    const halfW = (w - O.gapBetween) / 2;
    const r1: Rect = { minX: baseRect.minX,          maxX: baseRect.minX + halfW, minZ: baseRect.minZ, maxZ: baseRect.maxZ };
    const r2: Rect = { minX: baseRect.maxX - halfW,  maxX: baseRect.maxX,         minZ: baseRect.minZ, maxZ: baseRect.maxZ };

    const G = new THREE.Group(); G.name = "modern-awnings-A1";
    parent.add(G);

    G.add(buildAwningModule(r1, y0, O));
    G.add(buildAwningModule(r2, y0, O));

    // sombra suave no chão (opcional)
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.05, depthWrite: false })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.set((baseRect.minX + baseRect.maxX)/2, y0 + 0.001, (baseRect.minZ + baseRect.maxZ)/2);
    ground.receiveShadow = true;
    G.add(ground);

    return G;
}
