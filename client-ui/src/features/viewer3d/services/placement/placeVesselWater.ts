// services/placement/placeVesselWater.ts
import type { VesselDto, DockDto } from "../../types";

/** Opções globais de placement (podem ser sobrepostas por-vessel em v.placement). */
export type VesselPlacementOpts = {
    /** Afastamento lateral face à dock (água). */
    clearanceM?: number;        // default 4
    /** Deslocação ao longo da dock (positivo → para a “direita” da dock). */
    alongOffsetM?: number;      // default 0
    /** Ruído opcional para quebrar rigidez (metros). */
    jitterAlongM?: number;      // default 0
    jitterLateralM?: number;    // default 0

    /** Controlo de footprint (XZ) usado para o navio. */
    lengthScale?: number;       // default 1
    addLengthM?: number;        // default 0
    widthScale?: number;        // default 1
    addWidthM?: number;         // default 0

    /** Deslocação vertical do centro (subir/descer tudo). */
    yOffsetM?: number;          // default 0
};

/** Overrides por-vessel: `v.placement = { ... }` */
export type VesselPlacementOverride = Partial<VesselPlacementOpts>;

/** Máx. 8 vessels, 1 por dock (na mesma ordem). */
export function placeVesselsOnWater(
    vessels: (VesselDto & { placement?: VesselPlacementOverride })[],
    docks: Array<DockDto & { rotationY?: number }>,
    opts: VesselPlacementOpts = {}
): Array<VesselDto & { rotationY?: number; positionY?: number; placement?: VesselPlacementOverride }> {
    if (!Array.isArray(vessels) || !Array.isArray(docks) || docks.length === 0) return [];

    const O: Required<VesselPlacementOpts> = {
        clearanceM: 4,
        alongOffsetM: 0,
        jitterAlongM: 0,
        jitterLateralM: 0,
        lengthScale: 1,
        addLengthM: 0,
        widthScale: 1,
        addWidthM: 0,
        yOffsetM: 0,
        ...opts,
    };

    const count = Math.min(8, Math.min(vessels.length, docks.length));
    const out: Array<VesselDto & { rotationY?: number; positionY?: number; placement?: VesselPlacementOverride }> = [];

    for (let i = 0; i < count; i++) {
        const v0 = vessels[i];
        const d  = docks[i];

        const ov = { ...(v0.placement ?? {}) };
        const C  = { ...O, ...ov };

        const rot = Number(d.rotationY ?? 0);

        // normal (para a água) e tangente (ao longo da dock)
        const nX = Math.sin(rot), nZ = Math.cos(rot);   // lateral
        const tX = Math.cos(rot), tZ = -Math.sin(rot);  // along

        // tamanhos base “seguros”
        const length0 = Math.max(20, Number(v0.lengthMeters) || 70);
        const width0  = Math.max( 6, Number(v0.widthMeters)  || 18);

        const dockLen   = Math.max(10, Number(d.lengthM) || 80);
        const dockDepth = Math.max( 4, Number(d.depthM)  || 20);

        // aplicar escalas/aumentos pedidos
        const lengthUsed = Math.min(length0 * C.lengthScale + C.addLengthM, dockLen * 0.98);
        const widthUsed  = Math.max(2, width0  * C.widthScale  + C.addWidthM);

        // afastamento para não colidir com a doca
        const lateralOffset = dockDepth / 2 + widthUsed / 2 + C.clearanceM;

        // jitter
        const jAlong   = C.jitterAlongM   ? (Math.random() * 2 - 1) * C.jitterAlongM   : 0;
        const jLateral = C.jitterLateralM ? (Math.random() * 2 - 1) * C.jitterLateralM : 0;

        // posição final
        const px = Number(d.positionX) + (nX * (lateralOffset + jLateral)) + (tX * (C.alongOffsetM + jAlong));
        const pz = Number(d.positionZ) + (nZ * (lateralOffset + jLateral)) + (tZ * (C.alongOffsetM + jAlong));

        out.push({
            ...v0,
            lengthMeters: lengthUsed,
            widthMeters:  widthUsed,
            positionX: px,
            positionZ: pz,
            positionY: C.yOffsetM,
            rotationY: rot,
            placement: ov,
        });
    }

    return out;
}
