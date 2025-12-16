import type { Severity } from "../domain/incidentType";

export interface CreateIncidentTypeDTO {
    code: string;
    name: string;
    description: string;
    severity: Severity;
    parentCode?: string | null;
}
