import { operationsApi } from "../../../services/api";

import type { Incident, Severity } from "../domain/incident";
import type { CreateIncidentDTO } from "../dtos/createIncidentDTO";
import type { UpdateIncidentDTO } from "../dtos/updateIncidentDTO";
import type { IncidentDTO } from "../dtos/incidentDTO";
import { mapToIncidentDomain, mapToIncidentDomainList } from "../mappers/incidentMapper";
import {mapToVVEDomain} from "../../vesselVisitExecution/mappers/vesselVisitExecutionMapper.ts";
import type {VesselVisitExecution} from "../../vesselVisitExecution/domain/vesselVisitExecution.ts";

export async function createIncident(dto: CreateIncidentDTO): Promise<Incident> {
    const res = await operationsApi.post<IncidentDTO>("/api/incidents", dto);
    return mapToIncidentDomain(res.data);
}

export async function updateIncident(code: string, dto: UpdateIncidentDTO): Promise<Incident> {
    const res = await operationsApi.put<IncidentDTO>(`/api/incidents/${code}`, dto);
    return mapToIncidentDomain(res.data);
}

export async function deleteIncident(code: string): Promise<void> {
    await operationsApi.delete(`/api/incidents/${code}`);
}

export async function resolveIncident(code: string): Promise<Incident> {
    const res = await operationsApi.patch<IncidentDTO>(`/api/incidents/${code}/resolve`);
    return mapToIncidentDomain(res.data);
}

export async function addVVEToIncident(code: string, vve: string): Promise<Incident> {
    const res = await operationsApi.post<IncidentDTO>(`/api/incidents/${code}/vve/${vve}`, {});
    return mapToIncidentDomain(res.data);
}

export async function removeVVEFromIncident(code: string, vve: string): Promise<Incident> {
    const res = await operationsApi.delete<IncidentDTO>(`/api/incidents/${code}/vve/${vve}`);
    return mapToIncidentDomain(res.data);
}

export async function getAllIncidents(): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>("/api/incidents");
    return mapToIncidentDomainList(res.data);
}

export async function getIncidentByCode(code: string): Promise<Incident> {
    const res = await operationsApi.get<IncidentDTO>(`/api/incidents/${code}`);
    return mapToIncidentDomain(res.data);
}

export async function getActiveIncidents(): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>("/api/incidents/active");
    return mapToIncidentDomainList(res.data);
}

export async function getResolvedIncidents(): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>("/api/incidents/resolved");
    return mapToIncidentDomainList(res.data);
}

export async function getIncidentsByDateRange(startISO: string, endISO: string): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>("/api/incidents/search/date", {
        params: { start: startISO, end: endISO },
    });
    return mapToIncidentDomainList(res.data);
}

export async function getIncidentsBySeverity(severity: Severity): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>("/api/incidents/search/severity", {
        params: { severity },
    });
    return mapToIncidentDomainList(res.data);
}

export async function getIncidentsByVVE(vveCode: string): Promise<Incident[]> {
    const res = await operationsApi.get<IncidentDTO[]>(`/api/incidents/vve/${vveCode}`);
    return mapToIncidentDomainList(res.data);
}

// Adiciona isto ao final do teu ficheiro incidentService.ts

export async function getAllVVEs(): Promise<string[]> {
    const res = await operationsApi.get("/api/vve");

    const fullVVEs = res.data.map(mapToVVEDomain);

    return fullVVEs.map((vve: VesselVisitExecution) => vve.code.toString());
}