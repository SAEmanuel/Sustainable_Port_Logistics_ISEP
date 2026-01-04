import { operationsApi } from "../../../services/api.tsx";
import type { VesselVisitExecution } from "../domain/vesselVisitExecution.ts";
import type { CompleteVVEDto, CreateVesselVisitExecutionDto } from "../dto/vesselVisitExecutionDTO.ts"; // Importamos o DTO
import { mapToVVEDomain } from "../mappers/vesselVisitExecutionMapper.ts";

export async function getAllVVE(): Promise<VesselVisitExecution[]> {
    const res = await operationsApi.get("/api/vve");
    return res.data.map(mapToVVEDomain);
}

export async function getVVEById(id: string): Promise<VesselVisitExecution> {
    const res = await operationsApi.get(`/api/vve/${id}`);
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) throw new Error("VVE not found");
    return mapToVVEDomain(data);
}

export async function createVVE(dto: CreateVesselVisitExecutionDto): Promise<VesselVisitExecution> {
    const res = await operationsApi.post("/api/vve", dto);
    return mapToVVEDomain(res.data);
}

export async function completeVVE(dto: CompleteVVEDto,code: string): Promise<VesselVisitExecution> {
    const res = await operationsApi.put(`/api/vve/${code}/complete`, dto);
    return mapToVVEDomain(res.data);
}

export const VesselVisitExecutionService = {
    getAll: getAllVVE,
    getById: getVVEById,
    create: createVVE,
    complete: completeVVE
};