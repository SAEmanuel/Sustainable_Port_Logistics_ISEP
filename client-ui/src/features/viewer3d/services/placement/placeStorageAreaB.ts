// services/placement/placeStorageB.ts
import type { StorageAreaDto } from "../../types";
import type { GridsResult } from "../../scene/objects/Dock";

export function placeStorageAreasInB(storage: StorageAreaDto[], grids: GridsResult) {
    const B1 = grids.B["B.1"].rect;
    const B2 = grids.B["B.2"].rect;
    const MAX_B1 = 10, MAX_B2 = 10;

    let idx = uniformGrid(storage, 0, B1, MAX_B1, 6, 3, 0);
    if (idx < storage.length) {
        idx = uniformGrid(storage, idx, B2, MAX_B2, 6, 3, Math.PI);
    }
    // restantes ignorados
}

function uniformGrid(
    items: StorageAreaDto[], from: number,
    rect: { minX:number;maxX:number;minZ:number;maxZ:number },
    maxCount: number, margin: number, gap: number, rotY: number
) {
    const total = Math.min(maxCount, Math.max(0, items.length - from));
    if (!total) return from;

    const wRect = rect.maxX - rect.minX, dRect = rect.maxZ - rect.minZ;
    const aspect = wRect / Math.max(1e-6, dRect);
    let cols = Math.max(1, Math.min(total, Math.ceil(Math.sqrt(total * aspect))));
    let rows = Math.max(1, Math.ceil(total / cols));
    const cellW = (wRect - 2*margin - (cols-1)*gap) / cols;
    const cellD = (dRect - 2*margin - (rows-1)*gap) / rows;

    for (let k=0;k<total;k++){
        const i = from + k, r = Math.floor(k/cols), c = k%cols;
        const cx = rect.minX + margin + c*(cellW+gap) + cellW/2;
        const cz = rect.minZ + margin + r*(cellD+gap) + cellD/2;
        const sa = items[i] as any;
        sa.widthM = cellW; sa.depthM = cellD; sa.heightM = sa.heightM ?? 3;
        sa.positionX = cx; sa.positionY = sa.heightM/2; sa.positionZ = cz;
        sa.rotationY = rotY;
    }
    return from + total;
}
