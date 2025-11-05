// src/features/viewer3d/services/viewer3dService.ts
import api from "../../../services/api";
import type { SceneData, DockDto, StorageAreaDto, VesselDto, ContainerDto, PhysicalResourceDTO } from "../types";

export async function fetchDocks(): Promise<DockDto[]> {
    const { data } = await api.get("/api/dock");
    return data;
}

export async function fetchStorageAreas(): Promise<StorageAreaDto[]> {
    const { data } = await api.get("/api/storageareas");
    // Se não existir posição no backend, gera posições simples para visualizar
    return (data as StorageAreaDto[]).map((sa, i) => ({
        ...sa,
        positionX: sa.positionX ?? (i % 5) * 40,
        positionY: sa.positionY ?? 0,
        positionZ: sa.positionZ ?? Math.floor(i / 5) * 40,
    }));
}

export async function fetchVessels(): Promise<VesselDto[]> {
    const { data } = await api.get("/api/vessel");
    return (data as VesselDto[]).map((v, i) => ({
        ...v,
        lengthMeters: v.lengthMeters ?? 120,
        widthMeters: v.widthMeters ?? 20,
        draftMeters: v.draftMeters ?? 7,
        positionX: v.positionX ?? (i % 3) * 120 + 20,
        positionY: v.positionY ?? 0,
        positionZ: v.positionZ ?? 180 + Math.floor(i / 3) * 80,
    }));
}

export async function fetchContainers(): Promise<ContainerDto[]> {
    const { data } = await api.get("/api/container");
    return (data as ContainerDto[]).slice(0, 120).map((c, i) => ({
        ...c,
        positionX: c.positionX ?? (i % 20) * 3,
        positionY: c.positionY ?? Math.floor((i % 60) / 20) * 3,
        positionZ: c.positionZ ?? Math.floor(i / 60) * 3,
    }));
}

export async function fetchPhysicalResources(): Promise<PhysicalResourceDTO[]> {
    const { data } = await api.get("/api/physicalresource");
    return (data as PhysicalResourceDTO[]).map((r, i) => ({
        ...r,
        positionX: r.positionX ?? 10 + (i % 6) * 25,
        positionY: r.positionY ?? 0,
        positionZ: r.positionZ ?? 20 + Math.floor(i / 6) * 25,
    }));
}

export async function loadSceneData(): Promise<SceneData> {
    // Corre em paralelo
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
