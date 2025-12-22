import type { IncidentType } from "../domain/incidentType";
import type { CreateIncidentTypeDTO } from "../dtos/createIncidentTypeDTO";
import type { UpdateIncidentTypeDTO } from "../dtos/updateIncidentTypeDTO";
import { operationsApi } from "../../../services/api";
import { mapToIncidentTypeDomain } from "../mappers/incidentTypeMapper";

export async function createIncidentType(dto: CreateIncidentTypeDTO): Promise<IncidentType> {
    const res = await operationsApi.post("/api/incidentTypes", dto);
    return mapToIncidentTypeDomain(res.data);
}

export async function updateIncidentType(code: string, dto: UpdateIncidentTypeDTO): Promise<IncidentType> {
    const res = await operationsApi.put(`/api/incidentTypes/${code}`, dto);
    return mapToIncidentTypeDomain(res.data);
}

export async function getIncidentTypeByCode(code: string): Promise<IncidentType> {
    const res = await operationsApi.get(`/api/incidentTypes/${code}`);
    return mapToIncidentTypeDomain(res.data);
}

export async function getIncidentTypesByName(name: string): Promise<IncidentType[]> {
    const res = await operationsApi.get("/api/incidentTypes/search/name", { params: { name } });
    return res.data.map(mapToIncidentTypeDomain);
}

export async function getIncidentTypeRoots(): Promise<IncidentType[]> {
    const res = await operationsApi.get("/api/incidentTypes/roots");
    return res.data.map(mapToIncidentTypeDomain);
}

export async function getIncidentTypeChildren(parentCode: string): Promise<IncidentType[]> {
    const res = await operationsApi.get(`/api/incidentTypes/${parentCode}/children`);
    return res.data.map(mapToIncidentTypeDomain);
}

export async function getIncidentTypeSubtree(parentCode: string): Promise<IncidentType[]> {
    const res = await operationsApi.get(`/api/incidentTypes/${parentCode}/subtree`);
    return res.data.map(mapToIncidentTypeDomain);
}

export async function deleteIncidentType(code: string): Promise<void> {
    await operationsApi.delete(`/api/incidentTypes/${code}`);
}

export async function getAllIncidentTypes(): Promise<IncidentType[]> {
    const res = await operationsApi.get(`/api/incidentTypes/search/all`);
    return res.data.map(mapToIncidentTypeDomain);
}