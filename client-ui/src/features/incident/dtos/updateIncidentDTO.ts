import type { ImpactMode, Severity } from "../domain/incident";

export interface UpdateIncidentDTO {
    incidentTypeCode: string;
    vveList: string[];
    startTime: string;
    endTime: string | null;
    severity: Severity;
    impactMode: ImpactMode;
    description: string;
    upcomingWindowStartTime: string | null;
    upcomingWindowEndTime: string | null;
}
