// services/layoutEngine.ts
import type { SceneData } from "../types";
import type { GridsResult } from "../scene/objects/portGrids";

import { placeStorageAreasInB } from "./placement/placeStorageAreaB";
import { placeContainersA2_Max2PerSlot } from "./placement/placeContainerA2";
import { placeDocksC } from "./placement/placeDocksC";
import { placeVesselsOnWater, type VesselPlacementOpts } from "./placement/placeVesselWater";
import { placeDecorativeStorageAreasZoneC, type DecorativeSA } from "./placement/placeDecorativeStorageAreasZoneC";
import { placeDecorativeCranesZoneC, type DecorativeCrane, type DockEdgePlacement } from "./placement/placeDecorativeCranesZoneC";
import { placeResourcesUnderA1 } from "./placement/addResourcesUnderA1"; 

export type LayoutResult = {
    storage: SceneData["storageAreas"];
    containers: SceneData["containers"];
    docks: Array<SceneData["docks"][number] & { rotationY?: number }>;
    vessels: Array<SceneData["vessels"][number] & { rotationY?: number }>;
    decoratives: DecorativeSA[];
    decorativeCranes: DecorativeCrane[];
    resources: SceneData["resources"]; 
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

    // --- Vessels (1 por dock) ---
    const vesselOpts: VesselPlacementOpts = {
        lengthScale: 1.6, addLengthM: 20, widthScale: 1.9, addWidthM: 6,
        clearanceM: 8, yOffsetM: -34, jitterAlongM: 0, jitterLateralM: 0,
    };
    const vesselsRaw = (data.vessels ?? []).map(v => ({ ...v }));
    const vessels = placeVesselsOnWater(vesselsRaw as any, docks as any, vesselOpts);

    // --- Decoratives (Zona C) ---
    const decoratives = placeDecorativeStorageAreasZoneC(grids, {
        thicknessRatio: 0.15, lengthRatio: 0.40, edgeInsetM: 40,
        roadClearM: 30, heightM: 2, heightScale: 1.0, footprintScale: 0.30, includeTopBands: true,
    });

    // --- Decorative Cranes (1 por dock) ---
    const dockEdges: DockEdgePlacement[] = docks.map(d => ({
        id: d.id,
        positionX: Number(d.positionX) || 0,
        positionZ: Number(d.positionZ) || 0,
        lengthM:   Number(d.lengthM)   || 20,
        depthM:    Number(d.depthM)    || 10,
        rotationY: Number((d as any).rotationY) || 0,
    }));
    const decorativeCranes = placeDecorativeCranesZoneC(
        dockEdges,
        { occupyAlongRatio: 0.95, marginAlongM: 6, depthRatio: 0.70,
            heightM: 38, offsetFromWaterEdgeM: 1.0, alignAlong: 0.5 },
        (grids as any).C
    );

    // --- Physical Resources (A.1, sob os toldos) ---
    const resources = (data.resources ?? []).map(r => ({ ...r }));
    placeResourcesUnderA1(resources, grids, {
        fillWidthRatio: 0.97,
        fillDepthRatio: 0.86,
        marginX: 1.2,
        marginZ: 1.2,
        spacingX: 14,
        spacingZ: 12,
        maxPerRow: 12,
    });

    return { storage, containers, docks, vessels, decoratives, decorativeCranes, resources };
}
