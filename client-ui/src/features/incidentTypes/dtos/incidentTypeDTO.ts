import type { Severity } from "../domain/incidentType";

export interface IncidentTypeDTO {
    id: string;
    code: string;
    name: string;
    description: string;
    severity: Severity;
    parentCode: string | null;
}
