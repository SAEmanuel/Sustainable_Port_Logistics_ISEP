import * as THREE from "three";
import type { PortLayout } from "../objects/PortBase";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLBNormalized } from "../utils/loadGLBNormalized";

/* =====================================================================
   Tráfego com GLBs: sedan/suv (carros) e truck/truckCarrier (camiões)
   - cache via loadGLBNormalized (usa o teu GLTFLoader + DRACO)
   - base ancorada ao piso, escala para comprimento alvo, heading correcto
   - vias: principais + rua horizontal A/B + grelha interna da Zona C
   - mínimos por segmento e fallback hard (>=1 por via)
===================================================================== */

type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
type VehicleKind = "car" | "truck";

export type TrafficOpts = {
    approxVehicles?: number;
    truckRatio?: number;
    laneWidth?: number;
    lateralMargin?: number;
    minGapMeters?: number;
    roadY?: number;
    seed?: number;
    minPerRoad?: number;
    baseYawRad?: number; // compensa GLB virado (se necessário)
};

const DEFAULTS: Required<TrafficOpts> = {
    approxVehicles: 120,
    truckRatio: 0.30,
    laneWidth: 3.2,
    lateralMargin: 0.6,
    minGapMeters: 11,
    roadY: 0.03,
    seed: 20251110,
    minPerRoad: 1,
    baseYawRad: 0,
};

const TARGET = {
    car:   { L: 4.4,  W: 1.8, H: 1.5 },
    truck: { L: 10.5, W: 2.6, H: 3.2 },
} as const;

const CAR_URLS = [ASSETS_MODELS.vehicles.sedan, ASSETS_MODELS.vehicles.suv,ASSETS_MODELS.vehicles.taxi,ASSETS_MODELS.vehicles.sedanSport,ASSETS_MODELS.vehicles.suvluxury] as const;
const TRK_URLS = [ASSETS_MODELS.vehicles.truck, ASSETS_MODELS.vehicles.truckCarrier,ASSETS_MODELS.vehicles.garbagetruck,ASSETS_MODELS.vehicles.fireTuck] as const;

/* ---------------- RNG ---------------- */
function rnd(seed: { v: number }) {
    seed.v = (seed.v * 1664525 + 1013904223) >>> 0;
    return seed.v / 0xffffffff;
}

/* ---------------- helpers geom ---------------- */
function rectSize(r: Rect) { return { w: r.maxX - r.minX, d: r.maxZ - r.minZ }; }
function makeVerticalRect(xCut: number, zMin: number, zMax: number, roadW: number): Rect {
    return { minX: xCut - roadW / 2, maxX: xCut + roadW / 2, minZ: zMin, maxZ: zMax };
}
function makeHorizontalRect(xMin: number, xMax: number, zLine: number, roadW: number): Rect {
    return { minX: xMin, maxX: xMax, minZ: zLine - roadW / 2, maxZ: zLine + roadW / 2 };
}

/* ---------------- spawner GLB (base ancorada) ---------------- */
function spawnVehicleGLB(
    parent: THREE.Group,
    kind: VehicleKind,
    at: THREE.Vector3,
    yaw: number,          // 0 → along X ; π/2 → along Z
    roadY: number,
    baseYawRad = 0,
    segName?: string,
    segRect?: Rect
) {
    const dims = TARGET[kind];
    const SINK = -0.02;

    // placeholder imediato
    const ph = new THREE.Mesh(
        new THREE.BoxGeometry(dims.L, dims.H, dims.W),
        new THREE.MeshStandardMaterial({ color: kind === "truck" ? 0x94a3b8 : 0x0ea5e9, roughness: 0.6, metalness: 0.1 })
    );
    ph.position.set(at.x, roadY + dims.H / 2 + SINK, at.z);
    ph.rotation.y = yaw;
    ph.castShadow = true;
    (ph as any).userData.bounds = segRect;
    (ph as any).userData.__segName = segName ?? "";
    parent.add(ph);

    const urls = kind === "truck" ? TRK_URLS : CAR_URLS;
    const url = urls[Math.floor(Math.random() * urls.length)];

    loadGLBNormalized(url, { centerXZ: true, baseY0: true })
        .then((obj) => {
            const pivot = new THREE.Group();
            pivot.position.set(at.x, roadY + SINK, at.z);
            pivot.rotation.y = yaw;
            (pivot as any).userData.bounds = segRect;
            (pivot as any).userData.__segName = segName ?? "";
            parent.add(pivot);

            // escala para comprimento alvo
            const pre = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
            const currentLen = Math.max(pre.x, pre.y, pre.z) || 1;
            obj.scale.setScalar((dims.L / currentLen));

            // alinhar comprimento ao +X (se Z for o maior, roda)
            const s1 = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
            if (s1.z >= s1.x && s1.z >= s1.y) obj.rotation.y += Math.PI / 2;
            obj.rotation.y += baseYawRad;

            // re-ancorar base após transformações
            obj.updateWorldMatrix(true, true);
            const minY = new THREE.Box3().setFromObject(obj).min.y;
            obj.position.y -= minY;

            obj.traverse((c) => {
                const m = c as THREE.Mesh;
                if ((m as any).isMesh) { m.castShadow = true; m.receiveShadow = false; }
            });

            pivot.add(obj);
            parent.remove(ph);
            (ph.geometry as any)?.dispose?.(); (ph.material as any)?.dispose?.();
        })
        .catch(() => { /* fica o placeholder se falhar */ });
}

/* ---------------- populador de um retângulo/segmento ---------------- */
function populateRoadRect(
    G: THREE.Group,
    r: Rect,
    orientation: "x" | "z",
    count: number,
    opts: Required<TrafficOpts>,
    rng: { v: number },
    segName: string
) {
    const { w, d } = rectSize(r);
    if (w <= 0.5 || d <= 0.5 || count <= 0) return;

    const widthMeters  = orientation === "x" ? d : w;
    const lengthMeters = orientation === "x" ? w : d;

    const usableWidth = Math.max(0, widthMeters - opts.lateralMargin * 2);
    const lanes = Math.max(1, Math.floor(usableWidth / opts.laneWidth));
    const maxPerLane = Math.max(1, Math.floor(lengthMeters / opts.minGapMeters));
    const maxTotal = Math.max(1, lanes * maxPerLane);
    const toPlace = Math.min(count, maxTotal);

    const laneCenter = (laneIdx: number) =>
        (opts.lateralMargin + opts.laneWidth * 0.5) + laneIdx * opts.laneWidth;

    const yaw = orientation === "x" ? 0 : Math.PI / 2;

    for (let i = 0; i < toPlace; i++) {
        const lane = Math.floor(rnd(rng) * lanes);
        const along = rnd(rng) * lengthMeters;

        let x = r.minX, z = r.minZ;
        if (orientation === "x") {
            const zLocal = laneCenter(lane) + (rnd(rng) - 0.5) * (opts.laneWidth * 0.25);
            x = r.minX + Math.max(2, Math.min(along, lengthMeters - 2));
            z = r.minZ + zLocal;
        } else {
            const xLocal = laneCenter(lane) + (rnd(rng) - 0.5) * (opts.laneWidth * 0.25);
            z = r.minZ + Math.max(2, Math.min(along, lengthMeters - 2));
            x = r.minX + xLocal;
        }

        const isTruck = rnd(rng) < opts.truckRatio;
        spawnVehicleGLB(G, isTruck ? "truck" : "car", new THREE.Vector3(x, 0, z), yaw, opts.roadY, opts.baseYawRad, segName, r);
    }
}

/* ---------------- construir a lista de segmentos ---------------- */
function buildRoadSegments(layout: PortLayout) {
    const segs: Array<{ name: string; r: Rect; o: "x" | "z"; len: number; }> = [];
    const push = (name: string, r: Rect, o: "x" | "z") =>
        segs.push({ name, r, o, len: o === "x" ? (r.maxX - r.minX) : (r.maxZ - r.minZ) });

    // vias principais vindas do layout
    const R = layout.roads;
    const roadW = Math.max(0.5, R.north.rect.maxZ - R.north.rect.minZ);

    push("north",  R.north.rect,  "x");
    push("south",  R.south.rect,  "x");
    push("crossX", R.crossX.rect, "x");
    push("east",   R.east.rect,   "z");
    push("west",   R.west.rect,   "z");
    push("crossZ", R.crossZ.rect, "z");

    // rua horizontal A/B (meio da metade sul)
    const AB_zMid = (layout.zoneA.rect.minZ + layout.zoneA.rect.maxZ) / 2;
    const AB_xMin = layout.zoneB.rect.minX;
    const AB_xMax = layout.zoneA.rect.maxX;
    push("AB.horiz.mid", makeHorizontalRect(AB_xMin, AB_xMax, AB_zMid, roadW), "x");

    // grelha interna da Zona C
    const ZC = layout.zoneC.rect;
    const Wc = layout.zoneC.size.w;
    const cx = (ZC.minX + ZC.maxX) / 2;
    const cz = (ZC.minZ + ZC.maxZ) / 2;
    const zoneMinX = cx - (Wc / 4);
    const zoneMaxX = cx + (Wc / 4);

    // verticais C
    push("C.vert.left",  makeVerticalRect(zoneMinX, ZC.minZ, ZC.maxZ, roadW), "z");
    push("C.vert.mid",   makeVerticalRect(cx,       ZC.minZ, ZC.maxZ, roadW), "z");
    push("C.vert.right", makeVerticalRect(zoneMaxX, ZC.minZ, ZC.maxZ, roadW), "z");
    // horizontais C
    const zTop  = ZC.maxZ - 5;
    const zMid  = cz;
    const zBase = ZC.minZ;
    const zMid2 = (cz + ZC.minZ) / 2;
    push("C.horiz.top",  makeHorizontalRect(ZC.minX, ZC.maxX, zTop,  roadW), "x");
    push("C.horiz.mid",  makeHorizontalRect(ZC.minX, ZC.maxX, zMid,  roadW), "x");
    push("C.horiz.base", makeHorizontalRect(ZC.minX, ZC.maxX, zBase, roadW), "x");
    push("C.horiz.mid2", makeHorizontalRect(zoneMinX, zoneMaxX, zMid2, roadW), "x");

    return segs;
}

/* ---------------- API principal ---------------- */
export function addRoadTraffic(
    parent: THREE.Group,
    layout: PortLayout,
    options: TrafficOpts = {}
) {
    const opts = { ...DEFAULTS, ...options };
    const rng = { v: (opts.seed >>> 0) || 1 };

    const segments = buildRoadSegments(layout);

    // distribuição proporcional + mínimos
    const totalLen = Math.max(1e-6, segments.reduce((s, x) => s + Math.max(0, x.len), 0));
    const N = segments.length;
    const minPerRoad = Math.max(1, Math.floor(opts.minPerRoad));
    let targetTotal = Math.max(opts.approxVehicles, N * minPerRoad);

    const segEx = segments.map(s => {
        const share = Math.max(0, s.len) / totalLen;
        const raw = share * targetTotal;
        return { ...s, share, count: Math.floor(raw), frac: raw - Math.floor(raw) };
    });

    let placed = segEx.reduce((a, s) => a + s.count, 0);
    let remain = targetTotal - placed;
    segEx.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remain; i++) segEx[i % N].count++;
    segEx.forEach(s => { if (s.count < minPerRoad) s.count = minPerRoad; });

    const group = new THREE.Group();
    group.name = "traffic";
    parent.add(group);

    for (const s of segEx) {
        populateRoadRect(group, s.r, s.o, s.count, opts as Required<TrafficOpts>, rng, s.name);
    }

    // fallback: garantir >=1 por segmento
    const ensureOne = (seg: typeof segEx[number]) => {
        const cx = (seg.r.minX + seg.r.maxX) / 2;
        const cz = (seg.r.minZ + seg.r.maxZ) / 2;
        const isTruck = rnd(rng) < opts.truckRatio;
        const yaw = seg.o === "z" ? Math.PI / 2 : 0;
        spawnVehicleGLB(group, isTruck ? "truck" : "car", new THREE.Vector3(cx, 0, cz), yaw, opts.roadY, opts.baseYawRad, seg.name, seg.r);
    };
    for (const seg of segEx) {
        const hasAny = group.children.some(ch => (ch as any).userData?.bounds === seg.r || (ch as any).userData?.__segName === seg.name);
        if (!hasAny) ensureOne(seg);
    }

    return group;
}
