import {Severity} from "../domain/incidentTypes/severity";
import {ImpactMode} from "../domain/incident/impactMode";

export interface IIncidentDTO {
    id? : string,
    code : string,
    incidentTypeCode : string,
    vveList: string[];
    startTime : Date,
    endTime : Date | null,
    duration : number | null,
    severity : Severity,
    impactMode : ImpactMode,
    description: string,
    createdByUser : string,
    upcomingWindowStartTime : Date | null,
    upcomingWindowEndTime : Date | null
}