import api from "../../../services/api";
import type { PhysicalResource, CreatePhysicalResource, UpdatePhysicalResource, PhysicalResourceStatus, PhysicalResourceType } from "../types/physicalResource.ts";

export async function getPhysicalResource(): Promise<PhysicalResource[]>  {
    const res = await api.get("/api/PhysicalResource")
    return res.data;
}

// --- Funções do Serviço (GETs) ---

export async function getAllPhysicalResources(): Promise<PhysicalResource[]> {
    const res = await api.get("/api/PhysicalResource");
    return res.data;
}

export async function getPhysicalResourceById(id: string): Promise<PhysicalResource> {
    const res = await api.get(`/api/PhysicalResource/get/${id}`);
    return res.data;
}

export async function getPhysicalResourceByCode(code: string): Promise<PhysicalResource> {
    const res = await api.get(`/api/PhysicalResource/get/code/${code}`);
    return res.data;
}

export async function getPhysicalResourcesByDescription(description: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/description/${description}`);
    return res.data;
}

export async function getPhysicalResourcesByStatus(status: PhysicalResourceStatus | number): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/status/${status}`);
    return res.data;
}

export async function getPhysicalResourcesByType(type: PhysicalResourceType | number): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/type/${type}`);
    return res.data;
}

export async function getPhysicalResourcesByQualification(qualificationId: string): Promise<PhysicalResource[]> {
    const res = await api.get(`/api/PhysicalResource/get/qualification/${qualificationId}`);
    return res.data;
}

// --- Funções do Serviço (POST e PATCH) ---

export async function createPhysicalResource(dto: CreatePhysicalResource): Promise<PhysicalResource> {
    const res = await api.post("/api/PhysicalResource", dto);
    return res.data;
}

export async function updatePhysicalResource(id: string, dto: UpdatePhysicalResource): Promise<PhysicalResource> {
    const res = await api.patch(`/api/PhysicalResource/update/${id}`, dto);
    return res.data;
}

// export async function deactivatePhysicalResource(id: string): Promise<PhysicalResource> {
//     const res = await api.patch(`/api/PhysicalResource/deactivate/${id}`);
//     return res.data;
// }
//
// export async function activatePhysicalResource(id: string): Promise<PhysicalResource> {
//     const res = await api.patch(`/api/PhysicalResource/reactivate/${id}`);
//     return res.data;
// }

