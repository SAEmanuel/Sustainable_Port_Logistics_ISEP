import api from "../../../services/api";
import type { SceneData, DockDto, StorageAreaDto, VesselDto, ContainerDto, PhysicalResourceDTO } from "../types";

/** -------- helpers -------- */
const TEU_LENGTH = 6.06;
const TEU_WIDTH  = 2.44;
const TEU_HEIGHT = 2.59;

// Layout constants
const GRID = 10;
const WORLD_LIMIT = 1100;          // mantém tudo visível no plano
const QUAY_Z = -300;               // linha da “costa”

const DOCK_MARGIN = 20;

const VESSEL_ROW_OFFSET_Z = 60;
const VESSEL_ROW_GAP_Z    = 50;
const VESSEL_MARGIN       = 50;

const YARD_START_X = 350;
const YARD_START_Z = -50;
const YARD_GAP_X   = 30;
const YARD_GAP_Z   = 30;
const YARD_MAX_ROW = 3;

const RES_GRID_GAP = 24;

function unwrap(v: any): any {
    if (v == null) return v;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    if (typeof v === "object" && "value" in v) return (v as any).value;
    return v;
}
function num(x: any, fallback: number): number {
    const n = Number(unwrap(x));
    return Number.isFinite(n) ? n : fallback;
}
function str(x: any, fallback = ""): string {
    const s = unwrap(x);
    return (s == null) ? fallback : String(s);
}
function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}
function snap(v: number, step = GRID) {
    return Math.round(v / step) * step;
}

/** -------- fetchers (mapeamento + LAYOUT alinhado) -------- */

export async function fetchDocks(): Promise<DockDto[]> {
    try {
        const { data } = await api.get("/api/dock");
        const base = (data as any[]).map((d) => ({
            id: str(d.id),
            code: str(d.code),
            physicalResourceCodes: Array.isArray(d.physicalResourceCodes) ? d.physicalResourceCodes.map(unwrap).map(String) : [],
            location: d.location ?? undefined,
            lengthM: num(d.lengthM, 80),
            depthM:  num(d.depthM, 15),
            maxDraftM: num(d.maxDraftM, 8),
            status: str(d.status) as DockDto["status"],
            allowedVesselTypeIds: Array.isArray(d.allowedVesselTypeIds) ? d.allowedVesselTypeIds.map(unwrap).map(String) : [],
            positionX: 0, positionY: 0, positionZ: 0,
            rotationY: 0 as any,
        }));

        const totalLen = base.reduce((s, d) => s + Math.max(5, d.lengthM), 0) + DOCK_MARGIN * Math.max(0, base.length - 1);
        let cursorX = -totalLen / 2;

        base.forEach((d, i) => {
            const L = Math.max(5, d.lengthM);
            if (i > 0) cursorX += DOCK_MARGIN;
            const cx = clamp(snap(cursorX + L / 2), -WORLD_LIMIT, WORLD_LIMIT);
            d.positionX = cx; d.positionY = 0; d.positionZ = QUAY_Z;
            (d as any).rotationY = 0;
            cursorX += L / 2;
        });

        return base as DockDto[];
    } catch (e: any) {
        console.warn("fetchDocks failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchStorageAreas(): Promise<StorageAreaDto[]> {
    try {
        const { data } = await api.get("/api/storageareas");
        const items = (data as any[]).map((sa) => {
            const maxBays  = num(sa.maxBays, 6);
            const maxRows  = num(sa.maxRows, 4);
            const maxTiers = num(sa.maxTiers, 3);

            const widthM  = Math.max(TEU_LENGTH, maxBays * TEU_LENGTH);
            const depthM  = Math.max(TEU_WIDTH,  maxRows * TEU_WIDTH);
            const heightM = Math.max(TEU_HEIGHT, maxTiers * TEU_HEIGHT);

            return {
                id: str(sa.id),
                name: str(sa.name),
                description: sa.description ?? "",
                type: str(sa.type) as StorageAreaDto["type"],
                maxBays, maxRows, maxTiers,
                maxCapacityTeu: num(sa.maxCapacityTeu, maxBays * maxRows * maxTiers),
                currentCapacityTeu: num(sa.currentCapacityTeu, 0),
                physicalResources: Array.isArray(sa.physicalResources) ? sa.physicalResources.map((x: any) => x == null ? null : str(x)) : [],
                distancesToDocks: Array.isArray(sa.distancesToDocks) ? sa.distancesToDocks : [],
                widthM, depthM, heightM,
                positionX: 0, positionY: heightM / 2, positionZ: 0,
            } as StorageAreaDto & { widthM: number; depthM: number; heightM: number };
        });

        let col = 0, row = 0, rowMaxDepth = 0;
        let cursorX = YARD_START_X, cursorZ = YARD_START_Z;

        items.forEach((sa) => {
            if (col >= YARD_MAX_ROW) {
                col = 0; row++;
                cursorX = YARD_START_X;
                cursorZ += rowMaxDepth + YARD_GAP_Z;
                rowMaxDepth = 0;
            }

            const cx = clamp(snap(cursorX + sa.widthM / 2), -WORLD_LIMIT, WORLD_LIMIT);
            const cz = clamp(snap(cursorZ + sa.depthM / 2), -WORLD_LIMIT, WORLD_LIMIT);
            sa.positionX = cx; sa.positionZ = cz;

            cursorX += sa.widthM + YARD_GAP_X;
            rowMaxDepth = Math.max(rowMaxDepth, sa.depthM);
            col++;
        });

        return items;
    } catch (e: any) {
        console.warn("fetchStorageAreas failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchVessels(): Promise<VesselDto[]> {
    try {
        const { data } = await api.get("/api/vessel");
        const items = (data as any[]).map((v) => ({
            id: str(v.id),
            imoNumber: str(v.imoNumber),
            name: str(v.name),
            owner: str(v.owner),
            vesselTypeId: str(v.vesselTypeId),
            lengthMeters: num(v.lengthMeters, 70),
            widthMeters:  num(v.widthMeters,  18),
            draftMeters:  num(v.draftMeters,   7),
            positionX: 0, positionY: 0, positionZ: 0,
            rotationY: 0 as any,
        }));

        let row0X = -items.reduce((s, x) => s + Math.max(30, x.lengthMeters), 0) / 2;
        let row1X = row0X;

        items.forEach((v, idx) => {
            const L = Math.max(30, v.lengthMeters);
            const isRow1 = idx % 2 === 1;
            const cx = (isRow1 ? row1X : row0X) + L / 2;

            v.positionX = clamp(snap(cx), -WORLD_LIMIT, WORLD_LIMIT);
            v.positionY = 0;
            v.positionZ = clamp(snap(QUAY_Z + VESSEL_ROW_OFFSET_Z + (isRow1 ? VESSEL_ROW_GAP_Z : 0)), -WORLD_LIMIT, WORLD_LIMIT);
            (v as any).rotationY = 0;

            if (isRow1) row1X += L + VESSEL_MARGIN; else row0X += L + VESSEL_MARGIN;
        });

        return items;
    } catch (e: any) {
        console.warn("fetchVessels failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchContainers(): Promise<ContainerDto[]> {
    try {
        const { data } = await api.get("/api/container");
        const items = (data as any[]).slice(0, 300).map((c) => ({
            id: str(c.id),
            isoCode: str(c.isoCode),
            description: c.description ?? "",
            type: str(c.type) as ContainerDto["type"],
            status: str(c.status) as ContainerDto["status"],
            weightKg: num(c.weightKg, 0),
            positionX: 0, positionY: 0, positionZ: 0,
            rotationY: 0 as any,
        }));

        const COLS = 30, SPX = TEU_LENGTH + 0.5, SPZ = TEU_WIDTH + 0.5;
        const START_X = YARD_START_X, START_Z = YARD_START_Z + 150;

        items.forEach((c, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = clamp(snap(START_X + col * SPX), -WORLD_LIMIT, WORLD_LIMIT);
            const z = clamp(snap(START_Z + row * SPZ), -WORLD_LIMIT, WORLD_LIMIT);

            c.positionX = x;
            c.positionY = snap(TEU_HEIGHT / 2);
            c.positionZ = z;
            (c as any).rotationY = 0;
        });

        return items;
    } catch (e: any) {
        console.warn("fetchContainers failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchPhysicalResources(): Promise<PhysicalResourceDTO[]> {
    try {
        const { data } = await api.get("/api/physicalresource");
        const items = (data as any[]).map((r) => ({
            id: str(r.id),
            code: str(r.code),
            description: str(r.description),
            operationalCapacity: num(r.operationalCapacity, 0),
            setupTime: num(r.setupTime, 0),
            physicalResourceType: str(r.physicalResourceType),
            physicalResourceStatus: str(r.physicalResourceStatus),
            qualificationID: r.qualificationID ? str(r.qualificationID) : null,
            positionX: 0, positionY: 0, positionZ: 0,
        }));

        const COLS = 8;
        let col = 0, z = YARD_START_Z - 30;
        items.forEach((r) => {
            const x = clamp(snap(YARD_START_X + col * RES_GRID_GAP), -WORLD_LIMIT, WORLD_LIMIT);
            r.positionX = x; r.positionY = 0; r.positionZ = clamp(snap(z), -WORLD_LIMIT, WORLD_LIMIT);
            col++; if (col >= COLS) { col = 0; z += RES_GRID_GAP; }
        });

        return items;
    } catch (e: any) {
        console.warn("fetchPhysicalResources failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function loadSceneData(): Promise<SceneData> {
    const [docks, storageAreas, vessels, containers, resources] = await Promise.allSettled([
        fetchDocks(),
        fetchStorageAreas(),
        fetchVessels(),
        fetchContainers(),
        fetchPhysicalResources(),
    ]);

    return {
        docks: docks.status === "fulfilled" ? docks.value : [],
        storageAreas: storageAreas.status === "fulfilled" ? storageAreas.value : [],
        vessels: vessels.status === "fulfilled" ? vessels.value : [],
        containers: containers.status === "fulfilled" ? containers.value : [],
        resources: resources.status === "fulfilled" ? resources.value : [],
    };
}
