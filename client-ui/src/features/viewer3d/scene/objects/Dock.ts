// src/features/viewer3d/scene/objects/Dock.ts
import * as THREE from "three";
import type { DockDto } from "../../types";

/** Tipos utilitários iguais aos do portGrids.ts */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Grid = { rect: Rect; rows: number; cols: number };
export type GridsResult = {
    C: Record<`C.${1|2|3|4|5|6|7|8|9|10}`, Grid>;
    A: { "A.1": Grid; "A.2": Grid };
    B: { "B.1": Grid; "B.2": Grid };
};

/* ========================= TUNABLES ========================= */
const DOCK_LENGTH_RATIO = 0.88; // encurta o comprimento ao longo da aresta
const DOCK_DEPTH_M = 14;        // “largura” ortogonal à aresta
const DOCK_HEIGHT_M = 5;        // altura visual do bloco
const OVERHANG_M = 4;           // quanto “sai” para a água

/** Dados de colocação (inclui rotação) — NÃO é DockDto */
type DockPlacement = {
    lengthM: number;
    depthM: number;
    maxDraftM: number;
    positionX: number;
    positionZ: number;
    rotationY: number;
};

/* =============== PLACEHOLDER (até chegares ao GLB) =============== */
export function makeDock(d: DockDto): THREE.Mesh {
    const L = Math.max(1, Number(d.lengthM)   || 20);
    const W = Math.max(1, Number(d.depthM)    || DOCK_DEPTH_M);
    const H = Math.max(1, Number(d.maxDraftM) || DOCK_HEIGHT_M);

    const geom = new THREE.BoxGeometry(L, H, W);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x6e7a86, metalness: 0.15, roughness: 0.9 });
    const m = new THREE.Mesh(geom, mat);
    m.castShadow = true; m.receiveShadow = true;

    const x = Number(d.positionX) || 0;
    const z = Number(d.positionZ) || 0;
    const rotY = Number((d as any).rotationY) || 0; // <- usar as any para rotação

    m.position.set(x, H / 2, z); // base assenta no chão
    m.rotation.y = rotY;

    m.userData = { type: "Dock", id: d.id, label: d.code };
    return m;
}

/* ======================= LAYOUT NA ZONA C ======================= */
/**
 * Preenche até 8 docks com posição/rotação/medidas para a ZONA C.
 * Ordem:
 *   C.10 (right, vertical) → C.8 (right, vertical) → C.8 (top, horizontal)
 *   → C.5 top → C.6 top → C.7 top → C.7 right (vertical) → C.9 right (vertical)
 */
export function layoutDocksForZoneC(docks: DockDto[], grids: GridsResult) {
    if (!grids?.C || !Array.isArray(docks) || docks.length === 0) return;

    const order: Array<{ key: keyof GridsResult["C"]; side: "top"|"left"|"right" }> = [
        { key: "C.10", side: "right" },
        { key: "C.8",  side: "right" },
        { key: "C.8",  side: "top"   },
        { key: "C.5",  side: "top"   },
        { key: "C.6",  side: "top"   },
        { key: "C.7",  side: "top"   },
        { key: "C.7",  side: "right" },
        { key: "C.9",  side: "right" },
    ];

    const max = Math.min(8, docks.length);

    for (let i = 0; i < max; i++) {
        const plan = order[i];
        const g = grids.C[plan.key];
        if (!g) continue;

        const rect = g.rect;
        const place = buildPlacementForEdge(rect, plan.side, DOCK_DEPTH_M, OVERHANG_M);

        // Copiamos apenas campos que existem em DockDto;
        // e guardamos rotationY numa prop dinâmica (any)
        const d = docks[i] as any;
        d.lengthM   = place.lengthM;
        d.depthM    = place.depthM;
        d.maxDraftM = place.maxDraftM;
        d.positionX = place.positionX;
        d.positionZ = place.positionZ;
        d.rotationY = place.rotationY; // <- propriedade extra só para render
    }
}

/* =================== Helpers de posicionamento =================== */
function buildPlacementForEdge(
    rect: Rect,
    side: "left" | "right" | "top",
    depthM: number,
    overhang = OVERHANG_M
): DockPlacement {
    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;

    if (side === "top") {
        // dock horizontal no topo: comprimento ao longo do X
        const L = Math.max(2, w * DOCK_LENGTH_RATIO);
        const x = rect.minX + (w - L) / 2; // centrada no topo
        return {
            lengthM: L,
            depthM,
            maxDraftM: DOCK_HEIGHT_M,
            positionX: x + L / 2,
            positionZ: rect.maxZ + (depthM / 2 + overhang), // sai para a água
            rotationY: 0, // horizontal
        };
    }

    // lados verticais: comprimento ao longo do Z
    const L = Math.max(2, d * DOCK_LENGTH_RATIO);
    const z = rect.minZ + (d - L) / 2; // centrada ao longo do lado
    const xEdge = side === "left" ? rect.minX : rect.maxX;
    const sign  = side === "left" ? -1 : +1;

    return {
        lengthM: L,
        depthM,
        maxDraftM: DOCK_HEIGHT_M,
        positionX: xEdge + sign * (depthM / 2 + overhang), // encostada e a “sair” para a água
        positionZ: z + L / 2,
        rotationY: Math.PI / 2, // vertical
    };
}
