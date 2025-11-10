import * as THREE from "three";
import type { GridsResult, Rect } from "./portGrids";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLBNormalized } from "../utils/loadGLBNormalized";

/* =====================================================================
   Parking em C.1 e C.2 — MIolo centrado (não toca nas ruas)
===================================================================== */

export type ParkingOpts = {
    zones?: Array<"C.1" | "C.2">;
    angleDeg?: number;       // ângulo das vagas
    stallWidth?: number;     // largura útil da vaga (projeção)
    stallLength?: number;    // profundidade da vaga
    aisleWidth?: number;     // corredor entre duas filas de vagas
    edgeMargin?: number;     // margem lateral dentro do retângulo
    roadClearM?: number;     // folga às ruas nos limites Z
    lineWidth?: number;
    color?: number;
    roadY?: number;
    occupancy?: number;      // probabilidade de ocupar uma vaga
    seed?: number;
    blockDriveway?: number;  // via de circulação entre blocos (repete padrão)

    /** NOVO: proporção do retângulo da zona a usar (miolo centrado) */
    blockWidthRatio?: number;   // 0..1 (largura)
    blockDepthRatio?: number;   // 0..1 (profundidade)
};

const DEF: Required<ParkingOpts> = {
    zones: ["C.1", "C.2"],
    angleDeg: 60,
    stallWidth: 2.6,
    stallLength: 5.2,
    aisleWidth: 6.0,
    edgeMargin: 1.2,
    roadClearM: 3.5,
    lineWidth: 0.18,
    color: 0xffffff,
    roadY: 0.03,
    occupancy: 0.65,
    seed: 20251110,
    blockDriveway: 6.0,
    blockWidthRatio: 0.72,   // usa ~72% da largura
    blockDepthRatio: 0.55,   // usa ~55% da profundidade
};

// modelos existentes
const CAR_URLS = [ASSETS_MODELS.vehicles.sedan, ASSETS_MODELS.vehicles.suv,ASSETS_MODELS.vehicles.taxi,ASSETS_MODELS.vehicles.sedanSport,ASSETS_MODELS.vehicles.suvluxury,ASSETS_MODELS.vehicles.truck] as const;

/* ----------- helpers visuais: tiras/linhas no chão ----------- */
function addStrip(
    G: THREE.Group,
    x1: number, z1: number,
    x2: number, z2: number,
    y: number,
    width: number,
    color: number
) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz) || 0.0001;
    const ang = Math.atan2(dz, dx);
    const geom = new THREE.PlaneGeometry(len, width);
    const mat = new THREE.MeshStandardMaterial({
        color, metalness: 0, roughness: 1,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    const m = new THREE.Mesh(geom, mat);
    m.position.set((x1 + x2) / 2, y + 0.001, (z1 + z2) / 2);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = ang;
    m.renderOrder = 6;
    G.add(m);
}

/* ---------------- RNG ---------------- */
function rnd(seed: { v: number }) {
    seed.v = (seed.v * 1664525 + 1013904223) >>> 0;
    return seed.v / 0xffffffff;
}

/* ----------- spawn de carro estacionado (ligeiro) ----------- */
async function spawnParkedCar(
    parent: THREE.Group,
    pos: THREE.Vector3,
    yawRad: number,
    roadY: number
) {
    const url = CAR_URLS[Math.floor(Math.random() * CAR_URLS.length)];
    const obj = await loadGLBNormalized(url, { centerXZ: true, baseY0: true });

    // ~4.4 m de comprimento
    const targetL = 4.4;
    const s0 = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    const curL = Math.max(s0.x, s0.y, s0.z) || 1;
    obj.scale.setScalar(targetL / curL);

    // alinhamento
    const s1 = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    if (s1.z >= s1.x && s1.z >= s1.y) obj.rotation.y += Math.PI / 2;

    obj.updateWorldMatrix(true, true);
    const minY = new THREE.Box3().setFromObject(obj).min.y;
    obj.position.y -= minY;

    const pivot = new THREE.Group();
    pivot.position.set(pos.x, roadY - 0.02, pos.z);
    pivot.rotation.y = yawRad;
    obj.traverse((c) => { const m = c as THREE.Mesh; if ((m as any).isMesh) m.castShadow = true; });
    pivot.add(obj);
    parent.add(pivot);
}

/* ----------- desenha UMA fila oblíqua de lugares ----------- */
function makeAngledRow(
    G: THREE.Group,
    rect: Rect,
    baseZ: number,
    angleRad: number,
    opts: Required<ParkingOpts>,
    seed: { v: number },
    gCars?: THREE.Group
) {
    const pitch = opts.stallWidth / Math.cos(angleRad);
    const xMin = rect.minX + opts.edgeMargin;
    const xMax = rect.maxX - opts.edgeMargin;
    const span = Math.max(0, xMax - xMin);
    const count = Math.max(0, Math.floor(span / pitch));

    for (let i = 0; i < count; i++) {
        const x0 = xMin + i * pitch;
        const x1 = Math.min(x0 + pitch, xMax);

        const zA = baseZ;
        const zB = baseZ + opts.stallLength * Math.sin(angleRad);
        const stepX = opts.stallLength * Math.cos(angleRad);

        // laterais da vaga
        addStrip(G, x0, zA, x0 + stepX, zB, opts.roadY, opts.lineWidth, opts.color);
        addStrip(G, x1, zA, x1 + stepX, zB, opts.roadY, opts.lineWidth, opts.color);

        // traço na ponta
        const midX = (x0 + x1) / 2 + (opts.stallLength * 0.98) * Math.cos(angleRad);
        addStrip(G, midX - 0.4, zB, midX + 0.4, zB, opts.roadY, opts.lineWidth, opts.color);

        // carro (ocupação)
        if (gCars && rnd(seed) < opts.occupancy) {
            const cx = (x0 + x1) / 2 + (opts.stallLength * 0.45) * Math.cos(angleRad);
            const cz = baseZ + (opts.stallLength * 0.45) * Math.sin(angleRad);
            const jitter = (rnd(seed) - 0.5) * 0.25;
            spawnParkedCar(gCars, new THREE.Vector3(cx, 0, cz + jitter), angleRad, opts.roadY);
        }
    }
}

/* ----------- calcula um retângulo central (miolo) ----------- */
function centerSubRect(r: Rect, widthRatio: number, depthRatio: number, roadClearM: number): Rect {
    // aplica a folga de ruas primeiro
    const minZ = r.minZ + roadClearM;
    const maxZ = r.maxZ - roadClearM;

    const w = (r.maxX - r.minX) * THREE.MathUtils.clamp(widthRatio, 0.05, 1);
    const d = (maxZ - minZ)       * THREE.MathUtils.clamp(depthRatio, 0.05, 1);

    const cx = (r.minX + r.maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    return {
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minZ: cz - d / 2,
        maxZ: cz + d / 2,
    };
}

/* -------------------------- API principal -------------------------- */
export function addAngleParkingInC(
    parent: THREE.Group,
    grids: GridsResult | null | undefined,
    options: ParkingOpts = {}
) {
    if (!grids || !grids.C) {
        console.warn("[parking] grids ainda não prontas — ignorado.");
        return new THREE.Group();
    }
    const opts = { ...DEF, ...options };
    const angle = (opts.angleDeg * Math.PI) / 180;
    const rowDepth = opts.stallLength * Math.sin(angle); // avanço no Z por fila

    const G = new THREE.Group();
    G.name = "parking-C";
    parent.add(G);

    const gCars = new THREE.Group();
    gCars.name = "parking-cars";
    G.add(gCars);

    const seed = { v: opts.seed >>> 0 };

    const rects: Rect[] = opts.zones!
        .map((k) => grids.C[k as keyof typeof grids.C]?.rect)
        .filter(Boolean) as Rect[];

    for (const zoneRect of rects) {
        // 1) escolhe um “miolo” centrado dentro da zona (respeitando roadClearM)
        const inner = centerSubRect(zoneRect, opts.blockWidthRatio, opts.blockDepthRatio, opts.roadClearM);

        // 2) aplica também edgeMargin (não colar às bordas desse miolo)
        const rect: Rect = {
            minX: inner.minX + opts.edgeMargin,
            maxX: inner.maxX - opts.edgeMargin,
            minZ: inner.minZ + opts.edgeMargin,
            maxZ: inner.maxZ - opts.edgeMargin,
        };

        // 3) construir padrões até encher o MIolo (fila + corredor + fila), com vias entre blocos
        let zCursor = rect.minZ;
        const blockDepth = rowDepth * 2 + opts.aisleWidth;

        while (zCursor + blockDepth <= rect.maxZ) {
            // fila 1
            makeAngledRow(G, rect, zCursor, angle, opts, seed, gCars);
            addStrip(G, rect.minX, zCursor, rect.maxX, zCursor, opts.roadY, opts.lineWidth * 0.9, opts.color);

            // corredor
            const zRowEnd = zCursor + rowDepth;
            addStrip(G, rect.minX, zRowEnd, rect.maxX, zRowEnd, opts.roadY, opts.lineWidth, opts.color);

            // fila 2
            const zRow2 = zCursor + rowDepth + opts.aisleWidth;
            makeAngledRow(G, rect, zRow2, angle, opts, seed, gCars);

            // topo do bloco
            const zTop = zCursor + blockDepth;
            addStrip(G, rect.minX, zTop, rect.maxX, zTop, opts.roadY, opts.lineWidth, opts.color);

            // via entre blocos
            zCursor = zTop + opts.blockDriveway;
        }

        // última fila isolada se couber
        if (zCursor + rowDepth <= rect.maxZ) {
            makeAngledRow(G, rect, zCursor, angle, opts, seed, gCars);
            addStrip(G, rect.minX, zCursor, rect.maxX, zCursor, opts.roadY, opts.lineWidth * 0.9, opts.color);
        }
    }

    return G;
}
