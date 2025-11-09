// services/placement/placeContainersA2.ts
import type { ContainerDto } from "../../types";

export function placeContainersA2_Max2PerSlot(containers: ContainerDto[], gridA2: any) {
    const SCALE = 3;
    const ROAD_W = 12;
    const L40 = 12.19 * SCALE, W40 = 2.44 * SCALE, H = 2.59 * SCALE;
    const SAFE = 1.0, GAP_Y = 0.14;
    const rect = gridA2.rect;

    const insetFromX0 = ROAD_W/2 + W40/2 + SAFE;
    const insetFromZTop = ROAD_W/2 + L40/2 + SAFE;

    const strideR = 3, strideC = 2;

    const slots = gridA2.cells
        .filter((cell:any)=>{
            const {r,c,center}=cell, cx=center.x, cz=center.z;
            if (cx < rect.minX + insetFromX0) return false;
            if (cx > rect.maxX - (W40/2 + SAFE)) return false;
            if (cz < rect.minZ + (L40/2 + SAFE)) return false;
            if (cz > rect.maxZ - insetFromZTop)   return false;
            if (r<1 || r>=gridA2.rows-1 || c<1 || c>=gridA2.cols-1) return false;
            if (r%strideR!==0 || c%strideC!==0) return false;
            return true;
        })
        .sort((a:any,b:any)=>(a.c-b.c)||(a.r-b.r));

    if (!slots.length) return;

    for (let i=0;i<containers.length;i++){
        const slotIndex = Math.floor(i/2) % slots.length;
        const tier = i % 2;
        const cell = slots[slotIndex];
        const c = containers[i] as any;
        c.positionX = cell.center.x;
        c.positionY = (H/2) + tier*(H+GAP_Y);
        c.positionZ = cell.center.z;
        c.rotationY = 0;
    }
}
