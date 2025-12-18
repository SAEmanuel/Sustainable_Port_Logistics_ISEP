import {Result} from "../../core/logic/Result";
import { IIncidentDTO } from "../../dto/IIncidentDTO";
import { Severity } from "../../domain/incidentTypes/severity";

export default interface IIncidentService {
    createAsync(dto: IIncidentDTO): Promise<Result<IIncidentDTO>>;
    updateAsync(incidentCode: string, dto: IIncidentDTO): Promise<Result<IIncidentDTO>>;
    deleteAsync(incidentCode: string): Promise<Result<void>>;

    getByCodeAsync(incidentCode: string): Promise<Result<IIncidentDTO>>;
    getByDataRangeAsync(startDateRange: Date, endDateRange: Date): Promise<Result<IIncidentDTO[]>>;
    getBySeverityAsync(severity: Severity): Promise<Result<IIncidentDTO[]>>;
    getByVVEAsync(vveCode: string): Promise<Result<IIncidentDTO[]>>;

    getActiveIncidentsAsync(): Promise<Result<IIncidentDTO[]>>;
    getResolvedIncidentsAsync(): Promise<Result<IIncidentDTO[]>>;
    getAllIncidentAsync(): Promise<Result<IIncidentDTO[]>>;

    markAsResolvedAsync(incidentCode: string): Promise<Result<IIncidentDTO>>;
    addVVEToIncidentAsync(incidentCode: string, vveCode: string): Promise<Result<IIncidentDTO>>;
    removeVVEAsync(incidentCode: string, vveCode: string): Promise<Result<IIncidentDTO>>;
}