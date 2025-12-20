import type { ImpactMode, Severity } from "../domain/incident";

export interface CreateIncidentDTO {
    code: string;
    incidentTypeCode: string;
    vveList: string[];
    startTime: string;
    endTime: string | null;
    severity: Severity;
    impactMode: ImpactMode;
    description: string;
    createdByUser: string;
    upcomingWindowStartTime: string | null;
    upcomingWindowEndTime: string | null;
}
