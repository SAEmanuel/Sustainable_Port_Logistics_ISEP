import type { DockDto } from "../../types";
import type { GridsResult, Rect } from "../../scene/objects/Dock";

/* ========================= TUNABLES ========================= */
const DOCK_LENGTH_RATIO = 0.88; // encurta o comprimento ao longo da aresta
const DOCK_DEPTH_M      = 14;   // “largura” ortogonal à aresta
const DOCK_HEIGHT_M     = 5;    // altura visual
const OVERHANG_M        = 4;    // quanto “sai” para fora do cais (lado da água)

/** Resultado interno de cálculo (inclui rotação). */
type Placement = {
    lengthM: number; depthM: number; maxDraftM: number;
    positionX: number; positionZ: number; rotationY: number;
};

/** API pública: devolve no máx. 8 docks já posicionadas para a Zona C. */
export function placeDocksC(docks: DockDto[], grids: GridsResult) {
    if (!grids?.C || !Array.isArray(docks) || docks.length === 0) return [];

    // Ordem pedida:
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

    const out: Array<DockDto & { rotationY?: number }> = [];
    const max = Math.min(8, docks.length);

    for (let i = 0; i < max; i++) {
        const plan = order[i];
        const g = grids.C[plan.key];
        if (!g) continue;

        const p = buildPlacementForEdge(g.rect, plan.side, DOCK_DEPTH_M, OVERHANG_M);

        // Copiamos o DTO original (id/code do backend) e injectamos os campos calculados
        const src = docks[i];
        out.push({
            ...src,
            lengthM:   p.lengthM,
            depthM:    p.depthM,
            maxDraftM: p.maxDraftM,
            positionX: p.positionX,
            positionZ: p.positionZ,
            rotationY: p.rotationY, // campo adicional só para o cliente
        });
    }

    return out;
}

/* =================== Helpers de posicionamento =================== */
function buildPlacementForEdge(
    rect: Rect,
    side: "left" | "right" | "top",
    depthM: number,
    overhang = OVERHANG_M
): Placement {
    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;

    if (side === "top") {
        // horizontal no topo (água em cima)
        const L = Math.max(2, w * DOCK_LENGTH_RATIO);
        const x = rect.minX + (w - L) / 2; // centrada no topo
        return {
            lengthM: L,
            depthM,
            maxDraftM: DOCK_HEIGHT_M,
            positionX: x + L / 2,
            positionZ: rect.maxZ + (depthM / 2 + overhang), // sai para a água
            rotationY: 0,
        };
    }

    // lados verticais (água à esquerda/direita)
    const L = Math.max(2, d * DOCK_LENGTH_RATIO);
    const z = rect.minZ + (d - L) / 2; // centro ao longo do lado
    const xEdge = side === "left" ? rect.minX : rect.maxX;
    const sign  = side === "left" ? -1 : +1;

    return {
        lengthM: L,
        depthM,
        maxDraftM: DOCK_HEIGHT_M,
        positionX: xEdge + sign * (depthM / 2 + overhang), // encostada e a “sair”
        positionZ: z + L / 2,
        rotationY: Math.PI / 2,
    };
}
