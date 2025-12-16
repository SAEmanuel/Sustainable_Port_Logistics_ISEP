import type { Severity } from "../domain/incidentType";

export interface UpdateIncidentTypeDTO {
    name: string;
    description: string;
    severity: Severity;
    parentCode?: string | null;
}
