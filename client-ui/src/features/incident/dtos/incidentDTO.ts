import type { ImpactMode, Severity } from "../domain/incident";

export interface IncidentDTO {
    code: string;
    incidentTypeCode: string;
    vveList: string[];

    startTime: string;
    endTime: string | null;

    // se o backend devolver duration, tipa aqui
    duration?: number | null;

    severity: Severity;
    impactMode: ImpactMode;

    description: string;

    createdByUser: string;

    upcomingWindowStartTime?: string | null;
    upcomingWindowEndTime?: string | null;

    createdAt?: string;
    updatedAt?: string | null;
}
