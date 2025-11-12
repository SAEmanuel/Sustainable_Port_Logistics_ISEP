import * as THREE from "three";
import type { PortLayout } from "./PortBase";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLBNormalized } from "../utils/loadGLBNormalized";

/** Opções para plantar árvores ao longo das estradas */
export type RoadTreeOpts = {
    yGround?: number;          // Y do topo do cais
    roadWidth?: number;        // largura da via (igual à do PortBase)
    offsetFromRoad?: number;   // afastamento lateral a partir da berma
    spacing?: number;          // espaçamento base entre árvores (m)
    spacingPhase?: number;     // desfasamento inicial (m) para não alinhar com faróis
    jitterXY?: number;         // ruído aleatório lateral/longitudinal (m)
    clearMargin?: number;      // margem extra para manter fora da faixa
    density?: number;          // 0..1 fração de árvores colocadas
    scaleMin?: number;         // escala mínima
    scaleMax?: number;         // escala máxima
    seed?: number;             // semente determinística
    bothSides?: boolean;       // plantar nos 2 lados (true) ou só num lado (false)
    /** pesos relativos por tipo (se omitido = todos iguais) */
    weights?: Partial<Record<GreenKey, number>>;
};

const DEF: Required<Omit<RoadTreeOpts, "weights">> = {
    yGround: 0,
    roadWidth: 12,
    offsetFromRoad: 4.0,
    spacing: 18,
    spacingPhase: 9,
    jitterXY: 1.2,
    clearMargin: 2.0,
    density: 0.85,
    scaleMin: 0.85,
    scaleMax: 1.35,
    seed: 20251111,
    bothSides: true,
};

type GreenKey = "pine" | "fallTree" | "tree";

/* ================== Asset cache (3 tipos) ================== */
const GREEN_PATHS: Record<GreenKey, string> = {
    pine: ASSETS_MODELS.greens.pine,
    fallTree: ASSETS_MODELS.greens.fallTree,
    tree: ASSETS_MODELS.greens.tree,
};

type Cached = {
    root: THREE.Group;     // protótipo carregado
    baseHeight: number;    // altura do BB
    liftY: number;         // quanto subir para encostar a base ao y=0 (=-minY do BB)
};

const GREEN_CACHE = new Map<GreenKey, Cached>();

async function loadGreen(type: GreenKey): Promise<Cached> {
    if (GREEN_CACHE.has(type)) return GREEN_CACHE.get(type)!;

    const glb = await loadGLBNormalized(GREEN_PATHS[type]);
    const root: THREE.Group = (glb as any).scene ?? (glb as any);

    root.traverse((o: any) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material) o.material.side = THREE.FrontSide;
        }
    });

    // medir BB para obter altura e lift até ao chão
    const bb = new THREE.Box3().setFromObject(root);
    const baseHeight = Math.max(0.0001, bb.max.y - bb.min.y);
    const liftY = -bb.min.y;

    const cached: Cached = { root, baseHeight, liftY };
    GREEN_CACHE.set(type, cached);
    return cached;
}

async function ensureGreensLoaded(keys: GreenKey[]) {
    await Promise.all(keys.map((k) => loadGreen(k)));
}

/** clona um asset, aplica escala e levanta-o para que a base toque y=0 */
function cloneTree(type: GreenKey, heightScale: number): THREE.Group {
    const { root, liftY } = GREEN_CACHE.get(type)!;

    // container para manter yGround no node externo
    const container = new THREE.Group();

    const mesh = root.clone(true);
    mesh.scale.multiplyScalar(heightScale);
    // levantar/baixar de acordo com o BB do protótipo
    const EXTRA = 0.12; // sobe 12 cm
    mesh.position.y += liftY * heightScale + EXTRA;

    container.add(mesh);
    return container;
}

/* ================== RNG & picking ================== */
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

/** escolhe tipo por pesos a partir de u∈[0,1) */
function chooseWeightedFromU(
    u: number,
    weights: Partial<Record<GreenKey, number>>
): GreenKey {
    const keys: GreenKey[] = ["pine", "fallTree", "tree"];
    const entries = keys.map((k) => [k, Math.max(0, weights[k] ?? 1)] as const)
        .filter(([, w]) => w > 0);
    const safe = entries.length ? entries : keys.map((k) => [k, 1] as const);
    const total = safe.reduce((s, [, w]) => s + w, 0);
    let r = u * total;
    for (const [k, w] of safe) {
        if ((r -= w) <= 0) return k as GreenKey;
    }
    return safe[safe.length - 1][0] as GreenKey;
}

/** Fisher–Yates shuffle determinístico com o nosso RNG */
function shuffleInPlace<T>(arr: T[], rng: () => number) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/* ================== Helpers geométricos ================== */
function lerp(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()) {
    return out.copy(a).lerp(b, t);
}
function right2D(dir: THREE.Vector3, out = new THREE.Vector3()) {
    return out.set(-dir.z, 0, dir.x).normalize();
}
function cullIfInsideRoad(pos: THREE.Vector3, roadWidth: number, clearMargin: number, xCuts: number[], zCuts: number[]) {
    const half = roadWidth / 2 + clearMargin;
    for (const x of xCuts) if (Math.abs(pos.x - x) <= half) return true;
    for (const z of zCuts) if (Math.abs(pos.z - z) <= half) return true;
    return false;
}

/* ================== Marks/posições ================== */
type Mark = { pos: THREE.Vector3; rotY: number; heightScale: number };

function computeMarksAlong(
    A: THREE.Vector3,
    B: THREE.Vector3,
    o: Required<Omit<RoadTreeOpts, "weights">>,
    xCuts: number[],
    zCuts: number[],
    rng: () => number
): Mark[] {
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    if (len < 0.01) return [];
    dir.normalize();
    const right = right2D(dir);
    const marks: Mark[] = [];

    const totalSteps = Math.max(1, Math.floor((len - o.spacingPhase) / o.spacing));
    for (let i = 0; i <= totalSteps; i++) {
        if (rng() > o.density) continue;

        const tBase = (o.spacingPhase + i * o.spacing) / len;
        const t = Math.min(1, Math.max(0, tBase + (rng() - 0.5) * (o.jitterXY / len)));
        const center = lerp(A, B, t);

        const sides: (1 | -1)[] = o.bothSides ? [1, -1] : [1];
        for (const side of sides) {
            const lateral = o.roadWidth / 2 + o.offsetFromRoad + (rng() - 0.5) * o.jitterXY;
            const pos = center.clone().addScaledVector(right, side * lateral);
            pos.y = o.yGround;

            if (cullIfInsideRoad(pos, o.roadWidth, o.clearMargin, xCuts, zCuts)) continue;

            const heightScale = o.scaleMin + (o.scaleMax - o.scaleMin) * rng();
            const rotY = rng() * Math.PI * 2;
            marks.push({ pos, rotY, heightScale });
        }
    }
    return marks;
}

function computeAllMarks(
    layout: PortLayout,
    o: Required<Omit<RoadTreeOpts, "weights">>,
    rng: () => number
) {
    const W = layout.zoneC.size.w;
    const xL = -W / 2, xR = +W / 2;

    const zTop = layout.zoneC.rect.maxZ;
    const zMid = (layout.zoneC.rect.minZ + layout.zoneC.rect.maxZ) / 2;
    const zBot = layout.zoneC.rect.minZ;
    const zAB  = -layout.zoneA.size.d / 2;

    const xCuts = [-W / 4, 0, +W / 4];
    const zCuts = [zTop, zMid, zBot, zAB];

    const segs: [THREE.Vector3, THREE.Vector3, Required<Omit<RoadTreeOpts, "weights">>][] = [
        [new THREE.Vector3(xL, o.yGround, zTop), new THREE.Vector3(xR, o.yGround, zTop), { ...o, offsetFromRoad: o.offsetFromRoad + 1.5 }],
        [new THREE.Vector3(xL, o.yGround, zMid), new THREE.Vector3(xR, o.yGround, zMid), o],
        [new THREE.Vector3(xL, o.yGround, zBot), new THREE.Vector3(xR, o.yGround, zBot), o],
        [new THREE.Vector3(xL, o.yGround, zAB),  new THREE.Vector3(xR, o.yGround, zAB),  { ...o, spacingPhase: o.spacingPhase * 0.5 }],
        [new THREE.Vector3(0, o.yGround, -layout.zoneA.size.d), new THREE.Vector3(0, o.yGround, +layout.zoneC.size.d), { ...o, spacingPhase: o.spacing * 0.33 }],
    ];

    const all: Mark[] = [];
    for (const [A, B, opt] of segs) {
        all.push(...computeMarksAlong(A, B, opt, xCuts, zCuts, rng));
    }
    return all;
}

/* ================== Public API ================== */
/**
 * Adiciona árvores (GLB) aleatórias ao longo das vias.
 * Devolve o Group imediatamente e popula-o assíncronamente após carregar os modelos.
 * GARANTIA: se houver >= 3 posições, os três tipos (pine, fallTree, tree) aparecem pelo menos uma vez.
 * As bases dos GLBs são alinhadas ao solo (sem enterrar).
 */
export function addRoadTrees(scene: THREE.Scene, layout: PortLayout, user?: RoadTreeOpts): THREE.Group {
    const oBase = { ...DEF, ...(user ?? {}) };
    const rng = makeRng(oBase.seed);
    const G = new THREE.Group();
    G.name = "__RoadTrees";
    scene.add(G);

    // posições/marks determinísticas
    const marks = computeAllMarks(layout, oBase, rng);

    // pesos por defeito (ajusta à vontade)
    const weights: Partial<Record<GreenKey, number>> = {
        pine: 1, fallTree: 1, tree: 1,
        ...(user?.weights ?? {}),
    };

    (async () => {
        try {
            const keys: GreenKey[] = ["pine", "fallTree", "tree"];
            await ensureGreensLoaded(keys);

            // garantir diversidade nas 3 primeiras, se houver
            const forcedOrder: GreenKey[] = ["pine", "fallTree", "tree"];
            shuffleInPlace(forcedOrder, rng);

            for (let i = 0; i < marks.length; i++) {
                const m = marks[i];
                let type: GreenKey;

                if (marks.length >= 3 && i < 3) {
                    type = forcedOrder[i];
                } else {
                    const u = rng();
                    type = chooseWeightedFromU(u, weights);
                }

                const node = cloneTree(type, m.heightScale);
                node.position.copy(m.pos);
                node.rotation.y = m.rotY;
                G.add(node);
            }
        } catch (e) {
            console.warn("[RoadTrees] falha ao carregar/instanciar árvores:", e);
        }
    })();

    return G;
}
