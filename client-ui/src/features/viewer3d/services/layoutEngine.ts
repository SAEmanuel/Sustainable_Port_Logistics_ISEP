// services/layoutEngine.ts
import type { SceneData } from "../types";
import type { GridsResult } from "../scene/objects/portGrids";
import { placeStorageAreasInB } from "./placement/placeStorageAreaB";
import { placeContainersA2_Max2PerSlot } from "./placement/placeContainerA2";
import { placeDocksC } from "./placement/placeDocksC";
import { placeVesselsOnWater, type VesselPlacementOpts } from "./placement/placeVesselWater";
import { placeDecorativeStorageAreasZoneC } from "./placement/placeDecorativeStorageAreasZoneC";

/** Nó decorativo (retângulos amarelos em frente às docks na Zona C) */
export type DecorativeSA = {
    zone: string;
    widthM: number; depthM: number; heightM: number;
    positionX: number; positionZ: number; rotationY: number;
};

export type LayoutResult = {
    storage: SceneData["storageAreas"];
    containers: SceneData["containers"];
    docks: Array<SceneData["docks"][number] & { rotationY?: number }>;
    vessels: Array<SceneData["vessels"][number] & { rotationY?: number }>;
    decoratives: DecorativeSA[]; 
};

export function computeLayout(data: SceneData, grids: GridsResult): LayoutResult {
    // --- Storage (máx. 20) ---
    const storage = (data.storageAreas ?? []).slice(0, 20).map(sa => ({ ...sa }));
    placeStorageAreasInB(storage, grids);

    // --- Containers (A.2) ---
    const containers = (data.containers ?? []).map(c => ({ ...c }));
    const gridA2 = (grids as any)?.A?.["A.2"];
    if (gridA2) placeContainersA2_Max2PerSlot(containers, gridA2);

    // --- Docks (Zona C, máx. 8) ---
    const docks = placeDocksC(data.docks ?? [], grids);

    // --- Vessels (1 por dock, lado da água, máx. 8) ---
    const vesselOpts: VesselPlacementOpts = {
        lengthScale: 1.6,  // +60% no comprimento
        addLengthM:  20,   // +20 m extra
        widthScale:  1.9,  // +90% na largura
        addWidthM:   6,    // +6 m extra
        clearanceM:  8,    // mais afastado da doca para não colidir
        yOffsetM:    -34,  // subir/descer todos
        jitterAlongM:   0, // variação ao longo (0 = desligado)
        jitterLateralM: 0, // variação lateral (0 = desligado)
    };

    const vesselsRaw = (data.vessels ?? []).map(v => ({ ...v }));
    const vessels = placeVesselsOnWater(vesselsRaw as any, docks as any, vesselOpts);

    // --- Decoratives (Zona C: C.7, C.8, C.9, C.10 conforme regras) ---
    const decoratives = placeDecorativeStorageAreasZoneC(grids, {
        thicknessRatio: 0.15,
        lengthRatio: 0.40,
        edgeInsetM: 40,
        roadClearM: 30,
        heightM: 2,          // base
        heightScale: 1.0,    // ligeiro boost
        footprintScale: 0.30 // << encolhe tudo ~22%
    });



    return { storage, containers, docks, vessels, decoratives };
}
