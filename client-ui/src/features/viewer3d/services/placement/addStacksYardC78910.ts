// src/features/viewer3d/services/placement/addStacksYardC78910.ts
import * as THREE from "three";
import type { GridsResult, Rect } from "../../scene/objects/portGrids";
import { ASSETS_MODELS } from "../../scene/utils/assets";
import { loadGLBNormalized } from "../../scene/utils/loadGLBNormalized";

/* =================== Parâmetros base 40ft =================== */
const SCALE = 3;
const BASE = { L: 12.19 * SCALE, W: 2.44 * SCALE, H: 2.59 * SCALE };

export type StacksYardOpts = {
    zones?: Array<"C.7" | "C.8" | "C.9" | "C.10">;
    roadY?: number;

    // “cadeado” central (miolo utilizável)
    widthRatio?: number;
    depthRatio?: number;
    marginX?: number;
    marginZ?: number;

    // grelha
    gapX?: number;          // entre contentores na MESMA linha (eixo X)
    gapZ?: number;          // entre LINHAS (eixo Z)
    maxStack?: 1 | 2 | 3;
    maxCols?: number;       // limite superior de colunas (X)
    rowsMax?: number;       // limite superior de linhas (Z), 0 = sem limite

    // orientação única
    yawRad?: number;        // -PI/2 → comprimento // X

    // escala global do contentor (encolher para caber melhor)
    unitScale?: number;     // 0.6..1.0 (ex.: 0.85)
};

const DEF: Required<StacksYardOpts> = {
    zones: ["C.7", "C.8", "C.9", "C.10"],
    roadY: 0.03,
    widthRatio: 0.58,
    depthRatio: 0.55,
    marginX: 4,
    marginZ: 4,
    gapX: 0.40,
    gapZ: 0.20,
    maxStack: 3,
    maxCols: 24,
    rowsMax: 0,
    yawRad: -Math.PI / 2,
    unitScale: 0.85,
};

/* ---------------- utils do “cadeado” com viés em X ---------------- */
/**
 * Sub-rectângulo centrado em Z e com viés em X:
 *  biasX ∈ [-1..+1]  (-1 encosta à esquerda; 0 centro; +1 encosta à direita)
 */
function subRectWithBiasX(
    r: Rect, wRatio: number, dRatio: number, marginX: number, marginZ: number, biasX = 0
): Rect {
    const inner: Rect = {
        minX: r.minX + marginX, maxX: r.maxX - marginX,
        minZ: r.minZ + marginZ, maxZ: r.maxZ - marginZ,
    };
    const iw = inner.maxX - inner.minX;
    const id = inner.maxZ - inner.minZ;

    const w = iw * THREE.MathUtils.clamp(wRatio, 0.05, 1);
    const d = id * THREE.MathUtils.clamp(dRatio, 0.05, 1);

    const t = (THREE.MathUtils.clamp(biasX, -1, 1) + 1) / 2; // [-1,+1] → [0,1]
    const cx = inner.minX + w / 2 + (iw - w) * t;            // interpola para a borda
    const cz = inner.minZ + id / 2;                           // centrado em Z

    return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}

/* ----------- normalização + dimensão final medida ----------- */
async function loadAndNormalizeContainer(url: string, unitScale: number) {
    const root = await loadGLBNormalized(url, { centerXZ: true, baseY0: true });

    // medir como veio
    root.updateWorldMatrix(true, true);
    let box = new THREE.Box3().setFromObject(root);
    let sz = box.getSize(new THREE.Vector3());

    // alinhar comprimento ao eixo X
    if (sz.z > sz.x) {
        root.rotation.y -= Math.PI / 2;
        root.updateWorldMatrix(true, true);
        box = new THREE.Box3().setFromObject(root);
        sz = box.getSize(new THREE.Vector3());
    }

    // escala alvo (40ft*SCALE) * unitScale
    const target = { L: BASE.L * unitScale, W: BASE.W * unitScale, H: BASE.H * unitScale };
    const s = Math.min(
        target.L / Math.max(sz.x, 0.001),
        target.W / Math.max(sz.z, 0.001),
        target.H / Math.max(sz.y, 0.001)
    );
    root.scale.setScalar(s);

    // recentrar XZ e assentar em Y
    root.updateWorldMatrix(true, true);
    box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= minY;

    // sombras
    root.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // dimensões finais medidas (para step)
    root.updateWorldMatrix(true, true);
    const finalSize = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    return { root, size: finalSize };
}

/* ---------------- spawn de uma pilha ---------------- */
async function spawnStack(
    parent: THREE.Group,
    pos: THREE.Vector3,
    yawRad: number,
    roadY: number,
    stackH: number,
    urls: string[],
    unitScale: number
) {
    // mede a altura real do primeiro
    const first = await loadAndNormalizeContainer(urls[0], unitScale);
    const H = first.size.y;

    // para o primeiro nível usa o próprio first; restantes carregam alternando URLs
    for (let i = 0; i < stackH; i++) {
        const { root } = i === 0 ? first : await loadAndNormalizeContainer(urls[i % urls.length], unitScale);

        const pivot = new THREE.Group();
        pivot.position.set(pos.x, roadY + i * (H + 0.02), pos.z); // 0.02 evita z-fighting
        pivot.rotation.y = yawRad;

        pivot.add(root);
        parent.add(pivot);
    }
}

/* ---------------------- API principal ---------------------- */
export function addContainerYardsInC78910(
    parent: THREE.Group,
    grids: GridsResult | null | undefined,
    userOpts: StacksYardOpts = {}
) {
    if (!grids?.C) {
        console.warn("[stacks-yard] grids não prontas.");
        return new THREE.Group();
    }

    const O = { ...DEF, ...userOpts };
    const G = new THREE.Group(); G.name = "stacks-yard-C78910"; parent.add(G);

    // ε: folga mínima para NUNCA tocar mesmo com flutuações de bbox
    const EPS = 0.04;

    // viés por zona: puxa para o lado “água”
    const biasByZone: Record<"C.7" | "C.8" | "C.9" | "C.10", number> = {
        "C.7": -1, // esquerda
        "C.9": -1, // esquerda
        "C.8": +1, // direita
        "C.10": +1 // direita
    };

    for (const key of O.zones!) {
        const grid = grids.C[key as keyof typeof grids.C];
        if (!grid) continue;

        // Sub-rectângulo deslocado para a água
        const biasX = biasByZone[key as "C.7" | "C.8" | "C.9" | "C.10"] ?? 0;
        const yard = subRectWithBiasX(grid.rect, O.widthRatio, O.depthRatio, O.marginX, O.marginZ, biasX);

        const usableW = yard.maxX - yard.minX; // X
        const usableD = yard.maxZ - yard.minZ; // Z

        // estimativa inicial de step (antes de medir real)
        const estLen = BASE.L * O.unitScale;
        const estWid = BASE.W * O.unitScale;

        let stepX = estLen + O.gapX + EPS;
        let stepZ = estWid + O.gapZ + EPS;

        // slots máximos
        let colsRaw = Math.max(1, Math.floor(usableW / stepX));
        let rowsRaw = Math.max(1, Math.floor(usableD / stepZ));
        const cols = Math.min(colsRaw, Math.max(1, O.maxCols));
        const rows = O.rowsMax && O.rowsMax > 0 ? Math.min(rowsRaw, O.rowsMax) : rowsRaw;

        // medir um contentor real para refinar step
        const probe = loadAndNormalizeContainer(ASSETS_MODELS.containers.container, O.unitScale);
        let realLen = estLen, realWid = estWid;
        const ensureRealSize = async () => {
            const p = await probe;
            realLen = p.size.x; // comprimento ao longo de X
            realWid = p.size.z; // largura ao longo de Z
            stepX = realLen + O.gapX + EPS;
            stepZ = realWid + O.gapZ + EPS;
        };

        // centragem interna do grid já enviesado
        const offsetX = (usableW - cols * stepX) / 2 + stepX / 2;
        const offsetZ = (usableD - rows * stepZ) / 2 + stepZ / 2;

        const prep = ensureRealSize(); // garante step refinado

        // alternância de modelo por pilha
        let toggle = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = yard.minX + offsetX + c * stepX;
                const z = yard.minZ + offsetZ + r * stepZ;

                const urls =
                    toggle++ % 2 === 0
                        ? [ASSETS_MODELS.containers.container, ASSETS_MODELS.containers.container2]
                        : [ASSETS_MODELS.containers.container2, ASSETS_MODELS.containers.container];

                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    await prep;
                    const pos = new THREE.Vector3(x, 0, z);
                    await spawnStack(G, pos, O.yawRad, O.roadY, O.maxStack, urls, O.unitScale);
                })();
            }
        }
    }
    return G;
}
