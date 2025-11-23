import api from "../../../services/api";
import type {
    PhysicalResource,
    PhysicalResourceStatus,
    PhysicalResourceType
} from "../domain/physicalResource";

import type {
    CreatePhysicalResourceRequest,
    UpdatePhysicalResourceRequest
} from "../dtos/physicalResource";

import {
    mapToPhysicalResource,
    mapToCreatePhysicalResourceRequest
} from "../mappers/physicalResourceMapper";

export async function getPhysicalResource(): Promise<PhysicalResource[]>  {
    const res = await api.get("/api/PhysicalResource");
    return res.data.map(mapToPhysicalResource);
}

export async function getAllPhysicalResources(): Promise<PhysicalResource[]> {
    const res = await api.get("/api/PhysicalResource");
    return res.data.map(mapToPhysicalResource);
}

export async function getPhysicalResourceById(id: string): Promise<PhysicalResource> {
    const res = await api.get(`/api/PhysicalResource/get/${id}`);
    return mapToPhysicalResource(res.data);
}

export async function getPhysicalResourceByCode(code: string): Promise<PhysicalResource> {
    const res = await api.get(`/api/PhysicalResource/get/code/${code}`);
    return mapToPhysicalResource(res.data);
}

export async function getPhysicalResourcesByDescription(description: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/description/${description}`);
    return res.data.map(mapToPhysicalResource);
}

export async function getPhysicalResourcesByStatus(status: PhysicalResourceStatus | number): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/status/${status}`);
    return res.data.map(mapToPhysicalResource);
}

export async function getPhysicalResourcesByType(type: PhysicalResourceType | number): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/type/${type}`);
    return res.data.map(mapToPhysicalResource);
}

export async function getPhysicalResourcesByQualification(qualificationId: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/qualification/${qualificationId}`);
    return res.data.map(mapToPhysicalResource);
}

// --- Funções do Serviço (POST e PATCH) ---

export async function createPhysicalResource(dto: CreatePhysicalResourceRequest): Promise<PhysicalResource> {
    const payload = mapToCreatePhysicalResourceRequest(dto);
    const res = await api.post("/api/PhysicalResource", payload);

    return mapToPhysicalResource(res.data);
}

export async function updatePhysicalResource(id: string, dto: UpdatePhysicalResourceRequest): Promise<PhysicalResource> {
    const res = await api.patch(`/api/PhysicalResource/update/${id}`, dto);
    return mapToPhysicalResource(res.data);
}

// --- Funções do Serviço (ATIVAR e DESATIVAR) ---

export async function deactivatePhysicalResource(id: string): Promise<PhysicalResource> {
    const res = await api.patch(`/api/PhysicalResource/deactivate/${id}`);
    return mapToPhysicalResource(res.data);
}

export async function activatePhysicalResource(id: string): Promise<PhysicalResource> {
    const res = await api.patch(`/api/PhysicalResource/reactivate/${id}`);
    return mapToPhysicalResource(res.data);
}

// --- Funções do Serviço (Pesquisa Parcial) ---

export async function searchPhysicalResourcesByCode(partialCode: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/search/code/${partialCode}`);
    return res.data.map(mapToPhysicalResource);
}


export async function searchPhysicalResourcesByDescription(partialDesc: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/search/description/${partialDesc}`);
    return res.data.map(mapToPhysicalResource);
}