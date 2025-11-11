// src/features/viewer3d/services/placement/placeResourcesA1.ts
import * as THREE from "three";
import type { PhysicalResourceDTO } from "../../types";
import type { GridsResult, Rect } from "../../scene/objects/portGrids";
import { getResourceFootprint } from "../../scene/objects/PhysicalResource";

export type PlaceResourcesA1Opts = {
    fillWidthRatio?: number;
    fillDepthRatio?: number;
    marginX?: number;
    marginZ?: number;
    padX?: number;          // extra espaço em X (m)
    padZ?: number;          // extra espaço em Z (m)
    maxCols?: number;       // limite superior de colunas (0 = sem)
    roadY?: number;
};

const DEF: Required<PlaceResourcesA1Opts> = {
    fillWidthRatio: 0.97,
    fillDepthRatio: 0.90,
    marginX: 2.0,
    marginZ: 2.0,
    padX: 2.0,
    padZ: 2.0,
    maxCols: 0,
    roadY: 0.03,
};

function subRectCentered(r: Rect, wRatio: number, dRatio: number, mX: number, mZ: number): Rect {
    const inner: Rect = { minX: r.minX + mX, maxX: r.maxX - mX, minZ: r.minZ + mZ, maxZ: r.maxZ - mZ };
    const iw = inner.maxX - inner.minX, id = inner.maxZ - inner.minZ;
    const w = iw * THREE.MathUtils.clamp(wRatio, 0.05, 1);
    const d = id * THREE.MathUtils.clamp(dRatio, 0.05, 1);
    const cx = (inner.minX + inner.maxX) / 2, cz = (inner.minZ + inner.maxZ) / 2;
    return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}

/** Posiciona resources em grelha sob A.1, evitando sobreposições. */
export function placeResourcesUnderA1(
    resources: PhysicalResourceDTO[],
    grids: GridsResult,
    userOpts: Partial<PlaceResourcesA1Opts> = {}
): PhysicalResourceDTO[] {
    const O = { ...DEF, ...userOpts };
    const zone = grids.A?.["A.1"];
    if (!zone || !resources?.length) return resources;

    const base = subRectCentered(zone.rect, O.fillWidthRatio, O.fillDepthRatio, O.marginX, O.marginZ);
    const areaW = base.maxX - base.minX;
    const areaD = base.maxZ - base.minZ;

    // footprint máximo entre os tipos presentes (para célula uniforme)
    let maxL = 0, maxW = 0;
    for (const r of resources) {
        const fp = getResourceFootprint(r.physicalResourceType ?? "Other");
        maxL = Math.max(maxL, fp.L);
        maxW = Math.max(maxW, fp.W);
    }
    const cellX = maxL + O.padX; // comprimento (ao longo de X)
    const cellZ = maxW + O.padZ; // largura (ao longo de Z)

    // número de colunas/linhas que cabem
    let cols = Math.max(1, Math.floor(areaW / cellX));
    if (O.maxCols > 0) cols = Math.min(cols, O.maxCols);
    const rows = Math.max(1, Math.ceil(resources.length / cols));

    // centraliza a grelha no retângulo disponível
    const usedW = cols * cellX;
    const usedD = rows * cellZ;
    const startX = base.minX + (areaW - usedW) / 2 + cellX / 2;
    const startZ = base.minZ + (areaD - usedD) / 2 + cellZ / 2;

    // distribuição fileira a fileira
    resources.forEach((r, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * cellX;
        const z = startZ + row * cellZ;
        r.positionX = x;
        r.positionY = O.roadY;
        r.positionZ = z;
    });

    return resources;
}
