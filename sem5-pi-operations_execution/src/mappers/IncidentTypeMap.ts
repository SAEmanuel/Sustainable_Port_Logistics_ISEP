import {Mapper} from "../core/infra/Mapper";
import {IncidentType} from "../domain/incidentTypes/incidentType";
import {IIncidentTypeDTO} from "../dto/IIncidentTypeDTO";
import {IIncidentTypePersistence} from "../dataschema/IIncidentTypePersistence";
import {UniqueEntityID} from "../core/domain/UniqueEntityID";

export default class IncidentTypeMap extends Mapper<IncidentType, IIncidentTypeDTO, IIncidentTypePersistence>{
    toDTO(cat : IncidentType): IIncidentTypeDTO{
        return {
            id: cat.id.toString(),
            code: cat.code,
            name: cat.name,
            description: cat.description,
            severity : cat.severity,
            parentCode: cat.parentCode
        }
    }

    toDomain(raw: IIncidentTypePersistence): IncidentType | null {
        return IncidentType.creat(
            {
                code: raw.code,
                name: raw.name,
                description: raw.description,
                severity: raw.severity,
                parent: raw.parent ?? null,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt ?? null
            },
            new UniqueEntityID(raw.domainId)
        );
    }

    toPersistence(cat: IncidentType): IIncidentTypePersistence {
        return{
            domainId: cat.id.toString(),
            code: cat.code,
            name : cat.name,
            description : cat.description,
            severity : cat.severity,
            parent : cat.parentCode,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        };
    }
}