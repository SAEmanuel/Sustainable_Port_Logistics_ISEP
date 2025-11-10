// services/layoutEngine.ts
import type { SceneData } from "../types";
import type { GridsResult } from "../scene/objects/portGrids";

import { placeStorageAreasInB } from "./placement/placeStorageAreaB";
import { placeContainersA2_Max2PerSlot } from "./placement/placeContainerA2";
import { placeDocksC } from "./placement/placeDocksC";
import { placeVesselsOnWater, type VesselPlacementOpts } from "./placement/placeVesselWater";

import {
    placeDecorativeStorageAreasZoneC,
    type DecorativeSA,
} from "./placement/placeDecorativeStorageAreasZoneC";

import {
    placeDecorativeCranesZoneC,
    type DecorativeCrane,
    type DockEdgePlacement, // << usar o tipo mínimo (sem SceneData)
} from "./placement/placeDecorativeCranesZoneC";

export type LayoutResult = {
    storage: SceneData["storageAreas"];
    containers: SceneData["containers"];
    docks: Array<SceneData["docks"][number] & { rotationY?: number }>;
    vessels: Array<SceneData["vessels"][number] & { rotationY?: number }>;
    decoratives: DecorativeSA[];
    decorativeCranes: DecorativeCrane[];
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
    const docks = placeDocksC(data.docks ?? [], grids); // já vêm com rotationY calculado

    // --- Vessels (1 por dock, lado da água, máx. 8) ---
    const vesselOpts: VesselPlacementOpts = {
        lengthScale: 1.6,
        addLengthM: 20,
        widthScale: 1.9,
        addWidthM: 6,
        clearanceM: 8,
        yOffsetM: -34,
        jitterAlongM: 0,
        jitterLateralM: 0,
    };

    const vesselsRaw = (data.vessels ?? []).map(v => ({ ...v }));
    const vessels = placeVesselsOnWater(vesselsRaw as any, docks as any, vesselOpts);

    // --- Decoratives (Zona C: retângulos “baixos” amarelos) ---
    const decoratives = placeDecorativeStorageAreasZoneC(grids, {
        thicknessRatio: 0.15,
        lengthRatio: 0.40,
        edgeInsetM: 40,
        roadClearM: 30,
        heightM: 2,
        heightScale: 1.0,
        footprintScale: 0.30,
        includeTopBands: true,
    });

    // --- Decorative Cranes (retângulos altos sobre as docks) ---
    // Mapear os docks para o tipo mínimo esperado pelo placement decorativo
    const dockEdges: DockEdgePlacement[] = docks.map(d => ({
        id: d.id,
        positionX: Number(d.positionX) || 0,
        positionZ: Number(d.positionZ) || 0,
        lengthM:   Number(d.lengthM)   || 20,
        depthM:    Number(d.depthM)    || 10,
        rotationY: Number((d as any).rotationY) || 0,
    }));
    

// Grua decorativa em TORRE (um por dock)
    const decorativeCranes = placeDecorativeCranesZoneC(dockEdges, {
        baseRatio: 0.26,        // lado do quadrado ≈ 26% da profundidade do dock
        baseMinM: 3.2,
        baseMaxM: 8.5,
        heightM: 22,            // bem alto
        heightScale: 1.0,
        offsetFromEdgeM: 10.2,   // afasta um pouco da borda de água
        marginAlongM: 10,       // evita as pontas do dock
        alignAlong: 0.5,        // centro do dock (0 = ponta A, 1 = ponta B)
    });


    return { storage, containers, docks, vessels, decoratives, decorativeCranes };
}
