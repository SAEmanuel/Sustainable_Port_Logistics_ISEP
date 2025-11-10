// services/placement/placeDecorativeStorageAreasZoneC.ts
import type { GridsResult } from "../../scene/objects/portGrids";

/* ================== Tipos ================== */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type DecorativeSA = {
    zone: string;
    widthM: number; depthM: number; heightM: number;
    positionX: number; positionZ: number; rotationY: number;
};

/** Opções para escalar tamanhos/folgas/altura. */
export type DecoRectOpts = {
    edgeInsetM?: number;      // recuo geral às bordas (X e Z)
    roadClearM?: number;      // folga extra às ruas (aplicada nas extremidades em Z)

    thicknessRatio?: number;  // fração da largura útil usada como ESPESSURA (X)
    thicknessScale?: number;  // multiplicador rápido da espessura

    lengthRatio?: number;     // fração do comprimento útil usada como COMPRIMENTO (Z)
    lengthScale?: number;     // multiplicador rápido do comprimento

    heightM?: number;         // altura base (Y)
    heightScale?: number;     // multiplicador da altura

    includeTopBands?: boolean;// coloca também C.5 e C.6
    footprintScale?: number;
};

/* =============== Constantes/rotação =============== */
const ROT_FACE_POS_X = +Math.PI / 2;
const ROT_FACE_NEG_X = -Math.PI / 2;
const ROT_FACE_POS_Z = 0;

/* ================== Utils ================== */
const sizeX = (r: Rect) => r.maxX - r.minX;
const sizeZ = (r: Rect) => r.maxZ - r.minZ;
const midX  = (r: Rect) => (r.minX + r.maxX) / 2;

/* ================== Placement ================== */
export function placeDecorativeStorageAreasZoneC(
    grids: GridsResult,
    opts: DecoRectOpts = {}
): DecorativeSA[] {
    // defaults
    const O: Required<DecoRectOpts> = {
        edgeInsetM: 8,
        roadClearM: 8,
        thicknessRatio: 0.18,
        footprintScale:0.40,
        thicknessScale: 1,
        lengthRatio: 0.88,
        lengthScale: 1,
        heightM: 2,
        heightScale: 1,
        includeTopBands: true,
        ...opts,
    };

    const out: DecorativeSA[] = [];

    /* --------- Grupo LATERAIS: C.7, C.8, C.9, C.10 --------- */
    const lateralKeys: (keyof GridsResult["C"])[] = ["C.7","C.8","C.9","C.10"];

    // calcula o tamanho UNIFORME possível (com folgas) para TODAS as laterais
    let lateralWidth = Infinity;  // X
    let lateralDepth = Infinity;  // Z
    
    lateralWidth *= O.footprintScale;
    lateralDepth *= O.footprintScale;
    
    lateralKeys.forEach(k => {
        const r = grids.C[k]?.rect; if (!r) return;
        const usableX = Math.max(1, sizeX(r) - 2 * O.edgeInsetM);
        const usableZ = Math.max(1, sizeZ(r) - 2 * O.edgeInsetM);

        const widthCandidate  = Math.max(1, usableX * O.thicknessRatio * O.thicknessScale);
        const depthMax        = Math.max(0, usableZ - 2 * O.roadClearM);
        const depthCandidate  = Math.max(1, Math.min(depthMax, usableZ * O.lengthRatio * O.lengthScale));

        lateralWidth = Math.min(lateralWidth, widthCandidate);
        lateralDepth = Math.min(lateralDepth, depthCandidate);
    });

    // posiciona cada lateral encostando ao lado correto e centrando em Z no “corredor” com folga
    const placeLateral = (zoneKey: keyof GridsResult["C"], side: "left" | "right") => {
        const g = grids.C[zoneKey]; if (!g) return;
        const r = g.rect;

        const xLeft  = (r.minX + O.edgeInsetM) + lateralWidth / 2;
        const xRight = (r.maxX - O.edgeInsetM) - lateralWidth / 2;
        const posX   = side === "left" ? xLeft : xRight;

        const zMin   = r.minZ + O.edgeInsetM + O.roadClearM;
        const zMax   = r.maxZ - O.edgeInsetM - O.roadClearM;
        const posZ   = (zMin + zMax) / 2;

        out.push({
            zone: zoneKey,
            widthM: lateralWidth,
            depthM: lateralDepth,
            heightM: Math.max(0.1, O.heightM * O.heightScale),
            positionX: posX,
            positionZ: posZ,
            rotationY: side === "left" ? ROT_FACE_NEG_X : ROT_FACE_POS_X,
        });
    };

    placeLateral("C.7", "right");
    placeLateral("C.9", "right");
    placeLateral("C.8", "left");
    placeLateral("C.10", "left");

    /* --------- Grupo TOPO: C.5, C.6 (opcional) --------- */
    if (O.includeTopBands) {
        const topKeys: (keyof GridsResult["C"])[] = ["C.5","C.6"];

        // tamanho UNIFORME para topo (largura ao longo de X, espessura em Z)
        let topWidth = Infinity; // ao longo de X
        let topDepth = Infinity; // espessura em Z
        
        lateralWidth *= O.footprintScale;
        lateralDepth *= O.footprintScale;
        
        topKeys.forEach(k => {
            const r = grids.C[k]?.rect; if (!r) return;
            const usableX = Math.max(1, sizeX(r) - 2 * O.edgeInsetM);
            const usableZ = Math.max(1, sizeZ(r) - 2 * O.edgeInsetM);

            const widthCandidate = Math.max(1, usableX * O.lengthRatio * O.lengthScale);
            const depthCandidate = Math.max(1, usableZ * O.thicknessRatio * O.thicknessScale);

            // garantir que não encosta à rua inferior
            const depthMax = Math.max(0, usableZ - O.roadClearM); // uma margem para baixo
            topWidth = Math.min(topWidth, widthCandidate);
            topDepth = Math.min(topDepth, Math.min(depthCandidate, depthMax));
        });

        const bottomInset = O.edgeInsetM + O.roadClearM;

        const placeTop = (zoneKey: keyof GridsResult["C"]) => {
            const g = grids.C[zoneKey]; if (!g) return;
            const r = g.rect;

            const posX = midX(r);
            const posZ = (r.minZ + bottomInset) + topDepth / 2;

            out.push({
                zone: zoneKey,
                widthM: topWidth,
                depthM: topDepth,
                heightM: Math.max(0.1, O.heightM * O.heightScale),
                positionX: posX,
                positionZ: posZ,
                rotationY: ROT_FACE_POS_Z, // “olhar” para +Z
            });
        };

        placeTop("C.5");
        placeTop("C.6");
    }

    return out;
}
