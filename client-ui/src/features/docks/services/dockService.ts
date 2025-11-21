// src/docks/services/dockService.ts

import api from "../../../services/api";
import type {
    DockDto,
    CreateDockRequestDto,
    UpdateDockRequestDto,
} from "../dto/dockDtos";
import type { Dock } from "../domain/dock";
import { mapDockDto } from "../mappers/dockMapper";

export async function getDocks(): Promise<Dock[]> {
    const res = await api.get<DockDto[]>("/api/Dock");
    return res.data.map(mapDockDto);
}

export async function getDockById(id: string): Promise<Dock> {
    const res = await api.get<DockDto>(`/api/Dock/id/${id}`);
    return mapDockDto(res.data);
}

export async function getDockByCode(code: string): Promise<Dock> {
    const res = await api.get<DockDto>(`/api/Dock/code/${encodeURIComponent(code)}`);
    return mapDockDto(res.data);
}

export async function getDocksByVesselType(vesselTypeId: string): Promise<Dock[]> {
    const res = await api.get<DockDto[]>(
        `/api/Dock/vesseltype/${encodeURIComponent(vesselTypeId)}`
    );
    return res.data.map(mapDockDto);
}

export async function filterDocks(params: {
    code?: string;
    vesselTypeId?: string;
    location?: string;
    query?: string;
    status?: string;
}): Promise<Dock[]> {
    const res = await api.get<DockDto[]>("/api/Dock/filter", { params });
    return res.data.map(mapDockDto);
}

export async function getDocksByLocation(location: string): Promise<Dock[]> {
    const res = await api.get<DockDto[]>("/api/Dock/location", {
        params: { value: location },
    });
    return res.data.map(mapDockDto);
}

export async function createDock(data: CreateDockRequestDto): Promise<Dock> {
    const res = await api.post<DockDto>("/api/Dock", data);
    return mapDockDto(res.data);
}

export async function patchDockByCode(
    code: string,
    data: UpdateDockRequestDto
): Promise<Dock> {
    const res = await api.patch<DockDto>(
        `/api/Dock/code/${encodeURIComponent(code)}`,
        data
    );
    return mapDockDto(res.data);
}

export async function getDockByPhysicalResourceCode(code: string): Promise<Dock> {
    const res = await api.get<DockDto>(
        `/api/Dock/physical-code/${encodeURIComponent(code)}`
    );
    return mapDockDto(res.data);
}

export async function getAllDockCodes(): Promise<string[]> {
    const res = await api.get<string[]>("/api/Dock/codes");
    return res.data;
}
