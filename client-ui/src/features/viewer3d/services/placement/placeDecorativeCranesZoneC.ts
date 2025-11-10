// services/placement/placeDecorativeCranesZoneC.ts
// Posiciona gruas (primitivas) nas docks da Zona C com o braço orientado por célula.

export type DockEdgePlacement = {
    id?: string | number;
    positionX: number;
    positionZ: number;
    lengthM: number;     // comprimento ao longo da borda
    depthM: number;      // largura para dentro do cais
    rotationY?: number;  // orientação do COMPRIMENTO do dock (radianos)
};

export type DecorativeCrane = {
    dockId?: string | number;
    widthM: number;     // along do dock (X local)
    depthM: number;     // para dentro do cais (Z local)
    heightM: number;    // altura
    positionX: number;
    positionZ: number;

    // chassis segue o dock…
    rotationY: number;

    // …e o braço gira à parte (rotação RELATIVA ao chassis)
    childYaw?: number;
};

export type CranePlaceOpts = {
    occupyAlongRatio?: number;
    marginAlongM?: number;
    depthRatio?: number;
    depthMinM?: number;
    depthMaxM?: number;
    offsetFromWaterEdgeM?: number;
    heightM?: number;
    heightScale?: number;
    alignAlong?: number;
};

const DEF: Required<CranePlaceOpts> = {
    occupyAlongRatio: 0.95,
    marginAlongM: 6,
    depthRatio: 0.70,
    depthMinM: 6,
    depthMaxM: 9999,
    offsetFromWaterEdgeM: 1.0,
    heightM: 38,
    heightScale: 1.0,
    alignAlong: 0.5,
};

/* ---- Grid C, para mapeamento de orientação do braço ---- */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
type CKey = `C.${1|2|3|4|5|6|7|8|9|10}`;
export type GridC = Partial<Record<CKey, { rect: Rect }>>;

const contains = (r: Rect, x: number, z: number) =>
    x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

/** Yaw MUNDIAL desejado do BOOM por célula:
 *  Topo: C.5,C.6,C.7,C.8 → +X  (π/2)
 *  Direita: C.10        → +Z  (0)
 *  Esquerda: C.9        → −Z  (π)
 *  (C.7 no topo segue regra do topo → +X)
 */
const BOOM_WORLD_YAW: Partial<Record<CKey, number>> = {
    "C.5":  Math.PI/2,
    "C.6":  Math.PI/2,
    "C.7":  Math.PI/2,
    "C.8":  Math.PI/2,
    "C.10": 0,
    "C.9":  Math.PI,
};

const normPi = (a: number) => {
    // normaliza para [-π, π]
    let x = a;
    while (x >  Math.PI) x -= 2*Math.PI;
    while (x < -Math.PI) x += 2*Math.PI;
    return x;
};

export function placeDecorativeCranesZoneC(
    docks: DockEdgePlacement[],
    opts: CranePlaceOpts = {},
    gridC?: GridC
): DecorativeCrane[] {
    const O = { ...DEF, ...opts };
    const out: DecorativeCrane[] = [];

    for (const d of docks) {
        const L   = Math.max(1, Number(d.lengthM));
        const DEP = Math.max(1, Number(d.depthM));
        const rotDock = Number(d.rotationY ?? 0);
        const cx  = Number(d.positionX ?? 0);
        const cz  = Number(d.positionZ ?? 0);

        // Tamanhos
        const usable = Math.max(0, L - 2 * O.marginAlongM);
        const width  = Math.max(2, usable * O.occupyAlongRatio);
        const depth  = Math.min(
            Math.max(DEP * O.depthRatio, O.depthMinM),
            Math.min(O.depthMaxM, DEP - O.offsetFromWaterEdgeM - 0.5)
        );
        const height = Math.max(1, O.heightM * O.heightScale);

        // Direções do dock
        const alongX = Math.cos(rotDock);
        const alongZ = Math.sin(rotDock);
        const normalX = -alongZ;
        const normalZ =  alongX;

        // Encostar ao lado da água
        const lateralOffset = (DEP / 2) - (depth / 2) - O.offsetFromWaterEdgeM;

        // Posição ao longo
        const t = -usable / 2 + O.alignAlong * usable;
        const px = cx + t * alongX + lateralOffset * normalX;
        const pz = cz + t * alongZ + lateralOffset * normalZ;

        // === Cálculo do yaw do braço ===
        // 1) Por omissão, braço segue o dock (childYaw = 0).
        let childYaw = 0;

        // 2) Se soubermos a célula C.*, forçamos yaw mundial conforme mapa.
        if (gridC) {
            for (const k in gridC) {
                const key = k as CKey;
                const g = gridC[key];
                if (!g) continue;
                if (contains(g.rect, cx, cz)) {
                    const desiredWorld = BOOM_WORLD_YAW[key];
                    if (typeof desiredWorld === "number") {
                        // queremos: rotDock + childYaw = desiredWorld  ⇒  childYaw = desiredWorld − rotDock
                        childYaw = normPi(desiredWorld - rotDock);
                    }
                    break;
                }
            }
        }

        out.push({
            dockId: d.id,
            widthM: width,
            depthM: depth,
            heightM: height,
            positionX: px,
            positionZ: pz,
            rotationY: rotDock, // chassis alinhado ao dock
            childYaw,           // braço ajustado à célula (C.7/C.9 incluídas)
        });
    }

    return out;
}
