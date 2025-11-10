// src/features/viewer3d/scene/objects/buildings/addExtrasRowC34.ts
import * as THREE from "three";
import type { GridsResult, Rect } from "../../scene/objects/portGrids";
import { ASSETS_MODELS } from "../../scene/utils/assets";
import { loadGLBNormalized } from "../../scene/utils/loadGLBNormalized";

export type ExtrasRowOpts = {
    zones?: Array<"C.3" | "C.4">;
    marginX?: number;            // folga lateral dentro da metade
    marginZ?: number;            // folga em Z dentro da metade
    fillWidthRatio?: number;     // percentagem da largura da metade a usar (0..1)
    fillDepthRatio?: number;     // percentagem da profundidade a usar (0..1)
    cellGap?: number;            // espaço entre edifícios
    fitScaleFactor?: number;     // encosta à célula sem tocar (0.9..0.99)
    roadY?: number;
    /** “Mesmo tamanho” que as oficinas — podes ajustar aqui se quiseres */
    targetFootprint?: { x: number; z: number };
};

const DEF: Required<Omit<ExtrasRowOpts, "targetFootprint">> = {
    zones: ["C.3", "C.4"],
    marginX: 6,
    marginZ: 6,
    fillWidthRatio: 0.96,   // enche quase toda a largura
    fillDepthRatio: 0.80,   // faixa central em profundidade
    cellGap: 1.2,
    fitScaleFactor: 0.985,
    roadY: 0.03,
};

const ORDER: readonly ("chill" | "small" | "middle")[] = [
    "chill", "small", "middle", "small", "chill",
];

function halfFarFromParking(r: Rect): Rect {
    // parking está no “sul” (minZ..midZ). Metade longe = metade superior (midZ..maxZ)
    const midZ = (r.minZ + r.maxZ) / 2;
    return { minX: r.minX, maxX: r.maxX, minZ: midZ, maxZ: r.maxZ };
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

async function spawnFitted(
    parent: THREE.Group,
    url: string,
    cell: Rect,
    roadY: number,
    fitScaleFactor: number,
    _targetFootprint?: { x?: number; z?: number }, // ignoramos como “guia”, usamos bbox real
    yawRad = Math.PI,
) {
    const root = await loadGLBNormalized(url, { centerXZ: true, baseY0: true });

    // 1) mede o modelo “como veio”
    root.updateWorldMatrix(true, true);
    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());

    // 2) espaço disponível da célula (já com “folga” do fitScaleFactor)
    const cellW = (cell.maxX - cell.minX) * fitScaleFactor;
    const cellD = (cell.maxZ - cell.minZ) * fitScaleFactor;

    // 3) escala para CABER na célula (independente do tamanho original do GLB)
    //    -> este passo garante “grande” se o GLB vier minúsculo.
    const sPrimary = Math.min(
        cellW / Math.max(size.x, 0.001),
        cellD / Math.max(size.z, 0.001)
    );
    root.scale.setScalar(sPrimary);

    // 4) (opcional) pequeno “empurrão” para encostar mais sem tocar
    //    aumenta 1.5% e volta a medir para evitar encostar demais
    root.scale.multiplyScalar(1.015);

    // 5) re-assenta base e centra na célula
    root.updateWorldMatrix(true, true);
    box = new THREE.Box3().setFromObject(root);
    const minY = box.min.y;
    const cx = (cell.minX + cell.maxX) / 2;
    const cz = (cell.minZ + cell.maxZ) / 2;

    const pivot = new THREE.Group();
    pivot.position.set(cx, roadY, cz);
    pivot.rotation.y = yawRad;

    // assenta no chão
    root.position.y -= minY;

    // sombras
    root.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    pivot.add(root);
    parent.add(pivot);
}


export async function addExtrasRowInC34(
    parent: THREE.Group,
    grids: GridsResult | null | undefined,
    userOpts: ExtrasRowOpts = {}
) {
    if (!grids?.C) {
        console.warn("[extras-row] grids não prontas.");
        return new THREE.Group();
    }
    const O = { ...DEF, ...userOpts };
    const G = new THREE.Group(); G.name = "extras-C34"; parent.add(G);

    const urls = {
        chill:  ASSETS_MODELS.buildings.chillBuilding,
        middle: ASSETS_MODELS.buildings.midleBuilding,
        small:  ASSETS_MODELS.buildings.smallBuilding,
    } as const;

    for (const zoneKey of O.zones!) {
        const grid = grids.C[zoneKey];
        if (!grid) continue;

        // metade “longe” dos parques (norte) + margens + sub-rect centrado
        const half = halfFarFromParking(grid.rect);
        const halfInset = insetRect(half, O.marginX, O.marginZ);
        const fillRect = centerSubRect(halfInset, O.fillWidthRatio, O.fillDepthRatio);

        // 5 células em linha na largura
        const N = 5;
        const W = fillRect.maxX - fillRect.minX;
        const step = W / N;
        const z0 = fillRect.minZ + O.cellGap * 0.5;
        const z1 = fillRect.maxZ - O.cellGap * 0.5;

        for (let i = 0; i < N; i++) {
            // célula i
            const xL = fillRect.minX + step * i + O.cellGap * 0.5;
            const xR = fillRect.minX + step * (i + 1) - O.cellGap * 0.5;
            const cell: Rect = { minX: xL, maxX: xR, minZ: z0, maxZ: z1 };

            // modelo conforme a ordem pedida
            const kind = ORDER[i];
            const url =
                kind === "chill"  ? urls.chill  :
                    kind === "middle" ? urls.middle :
                        urls.small;

            await spawnFitted(
                G,
                url,
                cell,
                O.roadY,
                O.fitScaleFactor,
                O.targetFootprint ?? { x: 22, z: 14 }, // “mesmo tamanho” das oficinas
                Math.PI
            );
        }
    }

    return G;
}
