import type { Incident } from "../domain/incident";
import type { IncidentDTO } from "../dtos/incidentDTO";

function ensureIsoOrNull(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return null;
    return value;
}

function ensureIso(value: unknown): string {
    if (typeof value === "string" && value.trim() !== "") return value;
    return new Date().toISOString();
}

function ensureString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function ensureStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((x) => typeof x === "string") as string[];
}

function ensureNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
}

export function mapToIncidentDomain(dto: IncidentDTO): Incident {
    return {
        code: ensureString(dto.code),
        incidentTypeCode: ensureString(dto.incidentTypeCode),
        vveList: ensureStringArray(dto.vveList),

        startTime: ensureIso(dto.startTime),
        endTime: ensureIsoOrNull(dto.endTime),

        duration: ensureNumberOrNull(dto.duration),

        severity: dto.severity,
        impactMode: dto.impactMode,

        description: ensureString(dto.description),

        createdByUser: ensureString(dto.createdByUser),

        upcomingWindowStartTime: ensureIsoOrNull(dto.upcomingWindowStartTime),
        upcomingWindowEndTime: ensureIsoOrNull(dto.upcomingWindowEndTime),

        createdAt: ensureIsoOrNull(dto.createdAt) ?? undefined,
        updatedAt: ensureIsoOrNull(dto.updatedAt),
    };
}

export function mapToIncidentDomainList(dtos: IncidentDTO[]): Incident[] {
    return (dtos ?? []).map(mapToIncidentDomain);
}
