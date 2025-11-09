// services/layoutEngine.ts
import type { SceneData } from "../types";
import type { GridsResult } from "../scene/objects/portGrids";
import { placeStorageAreasInB } from "./placement/placeStorageAreaB";
import { placeContainersA2_Max2PerSlot } from "./placement/placeContainerA2";
import { placeDocksC } from "./placement/placeDocksC";


// Resultado único para o PortScene consumir
export type LayoutResult = {
    storage: SceneData["storageAreas"];   // já com position/size/rotation
    containers: SceneData["containers"];  // já com position/rotation
    docks: Array<SceneData["docks"][number] & { rotationY?: number }>;
};

/**
 * Orquestra TODO o posicionamento (B: storage, A.2: containers, C: docks).
 * Devolve cópias *já posicionadas* prontas para construir meshes.
 */
export function computeLayout(data: SceneData, grids: GridsResult): LayoutResult {
    // --- Storage (máx. 20) ---
    const storage = (data.storageAreas ?? []).slice(0, 20).map(sa => ({ ...sa }));
    placeStorageAreasInB(storage, grids); // escreve width/depth/height/pos/rot

    // --- Containers (A.2 com máx. 2 tiers por slot) ---
    const containers = (data.containers ?? []).map(c => ({ ...c }));
    const gridA2 = (grids as any)?.A?.["A.2"];
    if (gridA2) placeContainersA2_Max2PerSlot(containers, gridA2);

    // --- Docks (Zona C, máx. 8) ---
    const docks = placeDocksC(data.docks ?? [], grids); // já vem com rotationY

    return { storage, containers, docks };
}

