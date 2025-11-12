import * as THREE from "three";
import type { PortLayout } from "./PortBase";

/** opções de colocação dos postes/faróis */
export type RoadLightOpts = {
    yGround?: number;           // Y do topo do cais
    roadWidth?: number;         // largura da via (mesma de PortBase)
    poleHeight?: number;        // altura do poste
    poleOffset?: number;        // afastamento lateral da via (m) — a partir da berma
    spacing?: number;           // espaçamento entre postes (m)
    intensity?: number;         // intensidade da luz (se quiseres ligar mais tarde)
    spawnGlow?: boolean;        // desenhar a “bolinha” emissiva no topo (se usares)
    clearMargin?: number;       // margem extra para evitar postes dentro da faixa
};

const DEF: Required<RoadLightOpts> = {
    yGround: 0,
    roadWidth: 12,
    poleHeight: 7.5,
    poleOffset: 3.5,
    spacing: 22,
    intensity: 0,       
    spawnGlow: true,
    clearMargin: 2.0,
};

/** cria um poste simples + cabeça emissiva (“bolinha”) */
function makePoleWithHead(pos: THREE.Vector3, opts: Required<RoadLightOpts>): THREE.Group {
    const g = new THREE.Group();

    // Poste
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, opts.poleHeight, 12),
        new THREE.MeshStandardMaterial({ color: 0x2d2f33, metalness: 0.3, roughness: 0.9 })
    );
    pole.position.set(pos.x, pos.y + opts.poleHeight / 2, pos.z);
    g.add(pole);

    // Cabeça emissiva (bolinha)
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff6da })
    );
    head.position.set(pos.x, pos.y + opts.poleHeight, pos.z);
    g.add(head);

    // (opcional) SpotLight desligado por omissão — podes ligar depois
    if (opts.intensity > 0) {
        const spot = new THREE.SpotLight(0xfff3c4, opts.intensity, 46, THREE.MathUtils.degToRad(32), 0.6, 2);
        spot.position.set(pos.x, pos.y + opts.poleHeight, pos.z);
        spot.target.position.set(pos.x, pos.y + 0.1, pos.z);
        g.add(spot, spot.target);
    }

    return g;
}

/** auxiliares geométricos */
function lerp(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()) {
    return out.copy(a).lerp(b, t);
}
function right2D(dir: THREE.Vector3, out = new THREE.Vector3()) {
    // normal “para a direita” no plano XZ
    return out.set(-dir.z, 0, dir.x).normalize();
}

/** remove postes que calhem por cima de estradas verticais/horizontais */
function cullIfInsideRoad(pos: THREE.Vector3, opts: Required<RoadLightOpts>, xCuts: number[], zCuts: number[]): boolean {
    const half = opts.roadWidth / 2 + opts.clearMargin;
    for (const x of xCuts) if (Math.abs(pos.x - x) <= half) return true;
    for (const z of zCuts) if (Math.abs(pos.z - z) <= half) return true;
    return false;
}

/** cria postes ao longo de um segmento, encostados a UM lado da via */
function polesAlong(
    A: THREE.Vector3,
    B: THREE.Vector3,
    sideSign: 1 | -1,                   
    opts: Required<RoadLightOpts>,
    xCuts: number[],
    zCuts: number[],
): THREE.Group {
    const G = new THREE.Group();

    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    if (len < 0.01) return G;
    dir.normalize();
    const right = right2D(dir);

    const steps = Math.max(1, Math.floor(len / opts.spacing));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const center = lerp(A, B, t);
        const pos = center.clone().addScaledVector(right, sideSign * (opts.roadWidth / 2 + opts.poleOffset));
        pos.y = opts.yGround;

        // evitar cair dentro de qualquer faixa (interseções inclusive)
        if (cullIfInsideRoad(pos, opts, xCuts, zCuts)) continue;

        G.add(makePoleWithHead(pos, opts));
    }
    return G;
}

/** API principal */
export function addRoadPoles(scene: THREE.Scene, layout: PortLayout, user?: RoadLightOpts): THREE.Group {
    const o = { ...DEF, ...(user ?? {}) };
    const G = new THREE.Group(); G.name = "__RoadPoles";

    // ----- cortes/linhas principais do teu PortBase -----
    const W = layout.zoneC.size.w;
    const xL = -W / 2, xR = +W / 2;

    const zTop = layout.zoneC.rect.maxZ;           // topo da zona C (junto à água)
    const zMid = (layout.zoneC.rect.minZ + layout.zoneC.rect.maxZ) / 2;
    const zBot = layout.zoneC.rect.minZ;           // base da zona C (= 0)
    const zAB  = -layout.zoneA.size.d / 2;         // linha A ↔ B

    // estradas verticais (para fazer “clear” e p/ colocar a vertical do meio)
    const xCuts = [-W / 4, 0, +W / 4];
    // estradas horizontais usadas para culling (topo/meio/base + A↔B)
    const zCuts = [zTop, zMid, zBot, zAB];

    // ====== Horizontais da zona C ======
    // TOPO (zTop): recuar um bocado para fora da faixa (apenas esta linha)
    const oTop = { ...o, poleOffset: o.poleOffset + 4.0 }; 
    G.add(polesAlong(
        new THREE.Vector3(xL, o.yGround, zTop),
        new THREE.Vector3(xR, o.yGround, zTop),
        -1, oTop, xCuts, zCuts
    ));

    // MEIO (zMid): dois lados
    G.add(polesAlong(new THREE.Vector3(xL, o.yGround, zMid),
        new THREE.Vector3(xR, o.yGround, zMid),
        +1, o, xCuts, zCuts));
    G.add(polesAlong(new THREE.Vector3(xL, o.yGround, zMid),
        new THREE.Vector3(xR, o.yGround, zMid),
        -1, o, xCuts, zCuts));

    // BASE (zBot=0): lado da zona A/B → para +Z  => sideSign = +1
    G.add(polesAlong(new THREE.Vector3(xL, o.yGround, zBot),
        new THREE.Vector3(xR, o.yGround, zBot),
        +1, o, xCuts, zCuts));

    // ====== Horizontal A↔B (zAB) — dois lados ======
    G.add(polesAlong(new THREE.Vector3(xL, o.yGround, zAB),
        new THREE.Vector3(xR, o.yGround, zAB),
        +1, o, xCuts, zCuts));
    G.add(polesAlong(new THREE.Vector3(xL, o.yGround, zAB),
        new THREE.Vector3(xR, o.yGround, zAB),
        -1, o, xCuts, zCuts));

    // ====== Vertical do meio (x=0) — atravessa o cais todo ======
    const zMin = -layout.zoneA.size.d;     // -D/2
    const zMax = +layout.zoneC.size.d;     // +D/2
    G.add(polesAlong(new THREE.Vector3(0, o.yGround, zMin),
        new THREE.Vector3(0, o.yGround, zMax),
        +1, o, xCuts, zCuts));
    G.add(polesAlong(new THREE.Vector3(0, o.yGround, zMin),
        new THREE.Vector3(0, o.yGround, zMax),
        -1, o, xCuts, zCuts));

    scene.add(G);
    return G;
}
