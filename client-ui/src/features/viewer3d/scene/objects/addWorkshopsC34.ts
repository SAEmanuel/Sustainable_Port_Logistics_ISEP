import * as THREE from "three";
import type { GridsResult, Rect } from "../objects/portGrids";
import { ASSETS_MODELS } from "../utils/assets";
import { loadGLBNormalized } from "../utils/loadGLBNormalized";

export type WorkshopsOpts = {
    zones?: Array<"C.3" | "C.4">;
    countPerZone?: number;                // 5
    marginX?: number;                     // margem lateral dentro da metade
    marginZ?: number;                     // margem em Z dentro da metade
    faceParking?: boolean;                // orientar para os parques (-Z)
    roadY?: number;

    /** Quanto do retângulo “metade” queremos realmente usar (0..1) */
    fillWidthRatio?: number;
    fillDepthRatio?: number;

    /** Espaço entre edifícios (em metros) – quanto menor, mais cheio */
    cellGap?: number;

    /** Fator para “empurrar” a escala contra os limites da célula (0.92..0.99) */
    fitScaleFactor?: number;

    /** Proporção alvo do footprint, caso queiras forçar — deixa undefined para usar bbox do GLB */
    targetFootprint?: { x?: number; z?: number };
};

const DEF: Required<Omit<WorkshopsOpts, "targetFootprint">> = {
    zones: ["C.3", "C.4"],
    countPerZone: 5,
    marginX: 6,
    marginZ: 6,
    faceParking: true,
    roadY: 0.03,
    fillWidthRatio: 0.92,    // usar ~92% da largura da metade
    fillDepthRatio: 0.92,    // usar ~92% da profundidade da metade
    cellGap: 2.0,            // gap pequeno para “quase colado”, mas sem tocar
    fitScaleFactor: 0.97,    // enche bem a célula
};

function halfNearParking(r: Rect): Rect {
    const midZ = (r.minZ + r.maxZ) / 2;
    return { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: midZ };
}

function insetRect(r: Rect, dx: number, dz: number): Rect {
    return { minX: r.minX + dx, maxX: r.maxX - dx, minZ: r.minZ + dz, maxZ: r.maxZ - dz };
}

function centerSubRect(r: Rect, wRatio: number, dRatio: number): Rect {
    const w = (r.maxX - r.minX) * THREE.MathUtils.clamp(wRatio, 0.05, 1);
    const d = (r.maxZ - r.minZ) * THREE.MathUtils.clamp(dRatio, 0.05, 1);
    const cx = (r.minX + r.maxX) / 2;
    const cz = (r.minZ + r.maxZ) / 2;
    return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}

/** escolhe grelha (cols, rows) para N que maximize o uso de área do rect */
function chooseGridForN(N: number, rect: Rect): { cols: number; rows: number } {
    const W = rect.maxX - rect.minX;
    const D = rect.maxZ - rect.minZ;
    let best = { cols: N, rows: 1, score: -Infinity };

    // testamos combinações razoáveis (1..N colunas)
    for (let cols = 1; cols <= N; cols++) {
        const rows = Math.ceil(N / cols);
        const cellW = W / cols;
        const cellD = D / rows;
        const score = Math.min(cellW, cellD); // queremos células “grandes” no menor lado
        if (score > best.score) best = { cols, rows, score };
    }
    return { cols: best.cols, rows: Math.ceil(N / best.cols) };
}

async function spawnOfficeFittingCell(
    parent: THREE.Group,
    cell: Rect,
    options: {
        yaw: number;
        roadY: number;
        fitScaleFactor: number;
        targetFootprint?: { x?: number; z?: number };
    }
) {
    const root = await loadGLBNormalized(ASSETS_MODELS.buildings.bigOffice, { centerXZ: true, baseY0: true });

    // bounding box do modelo
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());

    // espaço disponível (tirando um pequeno “respiro”)
    const availW = (cell.maxX - cell.minX) * options.fitScaleFactor;
    const availD = (cell.maxZ - cell.minZ) * options.fitScaleFactor;

    // alvo: footprint
    const targetW = options.targetFootprint?.x ?? size.x;
    const targetD = options.targetFootprint?.z ?? size.z;

    // escalar para caber
    const s = Math.min(availW / targetW, availD / targetD);
    root.scale.setScalar(s);

    // reassentar base
    root.updateWorldMatrix(true, true);
    const minY = new THREE.Box3().setFromObject(root).min.y;
    root.position.y -= minY;

    // posicionar centro da célula
    const cx = (cell.minX + cell.maxX) / 2;
    const cz = (cell.minZ + cell.maxZ) / 2;

    const pivot = new THREE.Group();
    pivot.position.set(cx, options.roadY, cz);
    pivot.rotation.y = options.yaw; // inclui 180°

    // sombras
    root.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    pivot.add(root);
    parent.add(pivot);
}

export function addWorkshopsInC34(
    parent: THREE.Group,
    grids: GridsResult | null | undefined,
    userOpts: WorkshopsOpts = {}
) {
    if (!grids?.C) {
        console.warn("[workshops] grids não prontas.");
        return new THREE.Group();
    }
    const O = { ...DEF, ...userOpts };
    const G = new THREE.Group(); G.name = "workshops-C34"; parent.add(G);

    const zones: Array<"C.3" | "C.4"> = O.zones!;
    for (const key of zones) {
        const grid = grids.C[key];
        if (!grid) continue;

        // 1) metade perto do parking → insets e retângulo central para encher
        const half = halfNearParking(grid.rect);
        const halfInset = insetRect(half, O.marginX, O.marginZ);
        const fillRect = centerSubRect(halfInset, O.fillWidthRatio, O.fillDepthRatio);

        // 2) grelha para N=5 que maximize ocupação
        const N = Math.max(1, O.countPerZone);
        const { cols, rows } = chooseGridForN(N, fillRect);

        const W = fillRect.maxX - fillRect.minX;
        const D = fillRect.maxZ - fillRect.minZ;
        const cellW = W / cols;
        const cellD = D / rows;

        // 3) cria células e coloca edifícios (em “scanline”)
        let placed = 0;
        for (let r = 0; r < rows && placed < N; r++) {
            for (let c = 0; c < cols && placed < N; c++) {
                const x0 = fillRect.minX + c * cellW + O.cellGap * 0.5;
                const x1 = fillRect.minX + (c + 1) * cellW - O.cellGap * 0.5;
                const z0 = fillRect.minZ + r * cellD + O.cellGap * 0.5;
                const z1 = fillRect.minZ + (r + 1) * cellD - O.cellGap * 0.5;
                const cell: Rect = { minX: x0, maxX: x1, minZ: z0, maxZ: z1 };

                // yaw voltado aos parques (-Z), + rotação de 180º pedida
                const yawFaceParking = O.faceParking ? Math.PI : 0; // -Z é π
                const yawFinal = yawFaceParking + Math.PI;          // +180°

                spawnOfficeFittingCell(G, cell, {
                    yaw: yawFinal,
                    roadY: O.roadY,
                    fitScaleFactor: O.fitScaleFactor,
                    targetFootprint: O.targetFootprint,
                });

                placed++;
            }
        }
    }

    return G;
}
