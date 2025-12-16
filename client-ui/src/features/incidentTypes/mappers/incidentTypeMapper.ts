import type { IncidentType } from "../domain/incidentType";
import type { IncidentTypeDTO } from "../dtos/incidentTypeDTO";

export function mapToIncidentTypeDomain(dto: IncidentTypeDTO): IncidentType {
    return {
        id: dto.id,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        severity: dto.severity,
        parentCode: dto.parentCode ?? null
    };
}
