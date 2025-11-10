// services/placement/placeDecorativeCranesZoneC.ts

/** Dock mínimo necessário para posicionar gruas decorativas */
export type DockEdgePlacement = {
    id?: string | number;
    positionX: number;
    positionZ: number;
    lengthM: number;     // comprimento do deck ao longo da borda
    depthM: number;      // largura para dentro do cais
    rotationY?: number;  // orientação do comprimento (0 ou π/2 no teu layout)
};

/** Nó “grua decorativa” — torre (paralelepípedo alto) */
export type DecorativeCrane = {
    dockId?: string | number;
    widthM: number;     // footprint X (ortogonal ao dock)
    depthM: number;     // footprint Z (ao longo do dock) — aqui será ≈ widthM (torre)
    heightM: number;    // altura
    positionX: number;
    positionZ: number;
    rotationY: number;
};

/** Opções de afinação para TORRE (1 por dock) */
export type CranePlaceOpts = {
    baseRatio?: number;      // fração do depthM do dock para o lado do quadrado (ex.: 0.28)
    baseMinM?: number;       // mínimo absoluto do lado do quadrado
    baseMaxM?: number;       // máximo absoluto do lado do quadrado
    heightM?: number;        // altura base (ex.: 20)
    heightScale?: number;    // multiplicador de altura
    offsetFromEdgeM?: number;// afastar da borda da água para dentro do deck
    marginAlongM?: number;   // margem nas pontas do dock (ao longo)
    alignAlong?: number;     // 0..1 → posicionamento ao longo (0=início, 0.5=centro, 1=fim)
};

const DEF: Required<CranePlaceOpts> = {
    baseRatio: 0.28,
    baseMinM: 3,
    baseMaxM: 9999,
    heightM: 20,
    heightScale: 1.0,
    offsetFromEdgeM: 2.0,
    marginAlongM: 8,
    alignAlong: 0.5, // centro
};

export function placeDecorativeCranesZoneC(
    docks: DockEdgePlacement[],
    opts: CranePlaceOpts = {}
): DecorativeCrane[] {
    const O = { ...DEF, ...opts };
    const out: DecorativeCrane[] = [];

    for (const d of docks) {
        const L   = Math.max(1, Number(d.lengthM));
        const DEP = Math.max(1, Number(d.depthM));
        const rot = Number(d.rotationY ?? 0);
        const cx  = Number(d.positionX ?? 0);
        const cz  = Number(d.positionZ ?? 0);

        // lado do quadrado da base (torre) em função da profundidade do dock
        const side = Math.min(Math.max(DEP * O.baseRatio, O.baseMinM), O.baseMaxM);

        const height = Math.max(1, O.heightM * O.heightScale);

        // versores
        const along  = { x: Math.cos(rot), z: Math.sin(rot) }; // direção do comprimento do dock
        let normal: { x: number; z: number };

        // heurística para “lado da água”
        if (Math.abs(Math.sin(rot)) < 0.5) {
            // dock ~horizontal → água para +Z
            normal = { x: 0, z: +1 };
        } else {
            // dock ~vertical → água para o sinal de X do dock
            const signX = Math.sign(cx) || +1;
            normal = { x: signX, z: 0 };
        }

        // deslocamento transversal: encostar para o lado da água, mas ainda dentro do deck
        const lateralOffset = (DEP / 2) - (side / 2) - O.offsetFromEdgeM;

        // posição ao longo: usa align 0..1 no segmento útil
        const usable = Math.max(0, L - 2 * O.marginAlongM);
        const t = -usable / 2 + O.alignAlong * usable; // -…/2 → +…/2

        const px = cx + t * along.x + lateralOffset * normal.x;
        const pz = cz + t * along.z + lateralOffset * normal.z;

        out.push({
            dockId: d.id,
            widthM: side,
            depthM: side,     // quadrado
            heightM: height,
            positionX: px,
            positionZ: pz,
            rotationY: rot,   // irrelevante num quadrado, mas mantemos
        });
    }

    return out;
}
