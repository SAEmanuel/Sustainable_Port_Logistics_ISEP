import {Mapper} from "../core/infra/Mapper";
import {Incident} from "../domain/incident/incident";
import {IIncidentDTO} from "../dto/IIncidentDTO";
import {UniqueEntityID} from "../core/domain/UniqueEntityID";
import {IIncidentPersistence} from "../dataschema/IIncidentPersistence";


export default class IncidentMap extends Mapper<Incident, IIncidentDTO, IIncidentPersistence>{

    toDTO(i : Incident): IIncidentDTO{
        return {
            id : i.id.toString(),
            code : i.code,
            incidentTypeCode : i.incidentTypeCode,
            vveList : i.vveList,
            startTime : i.startTime,
            endTime : i.endTime,
            duration : i.duration,
            severity : i.severity,
            impactMode : i.impactMode,
            description : i.description,
            createdByUser : i.createdByUser,
            upcomingWindowStartTime : i.upcomingWindowStartTime,
            upcomingWindowEndTime : i.upcomingWindowEndTime,
        };
    }

    toDomain(raw : IIncidentPersistence) : Incident | null {
        return Incident.rehydrate(
            {
                code : raw.code,
                incidentTypeCode : raw.incidentTypeCode,
                vveList: raw.vveList,
                startTime : raw.startTime,
                endTime : raw.endTime ?? null,
                duration : raw.duration ?? null,
                severity : raw.severity,
                impactMode : raw.impactMode,
                description: raw.description,
                createdByUser : raw.createdByUser,
                upcomingWindowStartTime : raw.upcomingWindowStartTime ?? null,
                upcomingWindowEndTime : raw.upcomingWindowEndTime ?? null,

                createdAt : raw.createdAt,
                updatedAt : raw.updatedAt ?? null
            },
            new UniqueEntityID(raw.id)
        )
    }

    toPersistence(domain: Incident): IIncidentPersistence {
        return {
            id : domain.id.toString(),
            code : domain.code,
            incidentTypeCode : domain.incidentTypeCode,
            vveList: domain.vveList,
            startTime : domain.startTime,
            endTime : domain.endTime,
            duration : domain.duration,
            severity : domain.severity,
            impactMode : domain.impactMode,
            description: domain.description,
            createdByUser : domain.createdByUser,
            upcomingWindowStartTime : domain.upcomingWindowStartTime,
            upcomingWindowEndTime : domain.upcomingWindowEndTime,
            createdAt : domain.createdAt,
            updatedAt : domain.updatedAt
        };
    }

}