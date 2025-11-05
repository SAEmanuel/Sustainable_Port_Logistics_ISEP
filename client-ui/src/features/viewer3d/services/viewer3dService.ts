// src/features/viewer3d/services/viewer3dService.ts
import api from "../../../services/api";
import type {
    SceneData,
    DockDto,
    StorageAreaDto,
    VesselDto,
    ContainerDto,
    PhysicalResourceDTO,
} from "../types";

/** -------- helpers -------- */
const TEU_LENGTH = 6.06; // m (~20ft)
const TEU_WIDTH  = 2.44; // m
const TEU_HEIGHT = 2.59; // m

function unwrap(v: any): any {
    // lida com value objects { value: "..." } ou string direta
    if (v == null) return v;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    if (typeof v === "object" && "value" in v) return (v as any).value;
    // ImoNumber.ToString retorna "IMO XXXXXXX": aceita tal como vem
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
function pos(x: any, fallback: number): number {
    const n = Number(unwrap(x));
    return Number.isFinite(n) ? n : fallback;
}

/** -------- fetchers (com mapping/saneamento) -------- */

export async function fetchDocks(): Promise<DockDto[]> {
    try {
        const { data } = await api.get("/api/dock");
        return (data as any[]).map((d, i) => ({
            id: str(d.id),
            code: str(d.code),
            physicalResourceCodes: Array.isArray(d.physicalResourceCodes) ? d.physicalResourceCodes.map(unwrap).map(String) : [],
            location: d.location ?? undefined,
            lengthM: num(d.lengthM, 80),
            depthM: num(d.depthM, 15),
            maxDraftM: num(d.maxDraftM, 8),
            status: str(d.status) as DockDto["status"],
            allowedVesselTypeIds: Array.isArray(d.allowedVesselTypeIds) ? d.allowedVesselTypeIds.map(unwrap).map(String) : [],
            // sem posição no backend → distribui de forma legível
            positionX: (i % 3) * 160,
            positionY: 0,
            positionZ: -120 - Math.floor(i / 3) * 80,
        }));
    } catch (e: any) {
        console.warn("fetchDocks failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchStorageAreas(): Promise<StorageAreaDto[]> {
    try {
        const { data } = await api.get("/api/storageareas");
        return (data as any[]).map((sa, i) => {
            const maxBays = num(sa.maxBays, 6);
            const maxRows = num(sa.maxRows, 4);
            const maxTiers = num(sa.maxTiers, 3);

            const widthM  = Math.max(TEU_LENGTH, maxBays * TEU_LENGTH); // X ~ bays
            const depthM  = Math.max(TEU_WIDTH,  maxRows * TEU_WIDTH);   // Z ~ rows
            const heightM = Math.max(TEU_HEIGHT, maxTiers * TEU_HEIGHT); // Y ~ tiers

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
                positionX: pos(sa.positionX, (i % 5) * (widthM + 20)),
                positionY: pos(sa.positionY, heightM / 2),
                positionZ: pos(sa.positionZ, Math.floor(i / 5) * (depthM + 20)),
            } as StorageAreaDto;
        });
    } catch (e: any) {
        console.warn("fetchStorageAreas failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchVessels(): Promise<VesselDto[]> {
    try {
        const { data } = await api.get("/api/vessel");
        return (data as any[]).map((v, i) => ({
            id: str(v.id),
            imoNumber: str(v.imoNumber), // "IMO 1234567" ou {value}
            name: str(v.name),
            owner: str(v.owner),
            vesselTypeId: str(v.vesselTypeId),
            // sem dimensões → defaults razoáveis
            lengthMeters: num(v.lengthMeters, 30),
            widthMeters:  num(v.widthMeters,  22),
            draftMeters:  num(v.draftMeters,  7),
            positionX: pos(v.positionX,  100 + (i % 4) * 140),
            positionY: pos(v.positionY,  0),
            positionZ: pos(v.positionZ,  160 + Math.floor(i / 4) * 80),
        }));
    } catch (e: any) {
        console.warn("fetchVessels failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchContainers(): Promise<ContainerDto[]> {
    try {
        const { data } = await api.get("/api/container");
        return (data as any[])
            .slice(0, 300)
            .map((c, i) => ({
                id: str(c.id),
                isoCode: str(c.isoCode),
                description: c.description ?? "",
                type: str(c.type) as ContainerDto["type"],
                status: str(c.status) as ContainerDto["status"],
                weightKg: num(c.weightKg, 0),
                positionX: pos(c.positionX, (i % 30) * 3.0),
                positionY: pos(c.positionY, Math.floor((i % 90) / 30) * TEU_HEIGHT),
                positionZ: pos(c.positionZ, Math.floor(i / 90) * 6.5),
            }));
    } catch (e: any) {
        console.warn("fetchContainers failed:", e?.response?.status, e?.message);
        return [];
    }
}

export async function fetchPhysicalResources(): Promise<PhysicalResourceDTO[]> {
    try {
        const { data } = await api.get("/api/physicalresource");
        return (data as any[]).map((r, i) => ({
            id: str(r.id),
            code: str(r.code),
            description: str(r.description),
            operationalCapacity: num(r.operationalCapacity, 0),
            setupTime: num(r.setupTime, 0),
            physicalResourceType: str(r.physicalResourceType),
            physicalResourceStatus: str(r.physicalResourceStatus),
            qualificationID: r.qualificationID ? str(r.qualificationID) : null,
            positionX: pos(r.positionX, 10 + (i % 8) * 24),
            positionY: pos(r.positionY, 0),
            positionZ: pos(r.positionZ, 20 + Math.floor(i / 8) * 24),
        }));
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
