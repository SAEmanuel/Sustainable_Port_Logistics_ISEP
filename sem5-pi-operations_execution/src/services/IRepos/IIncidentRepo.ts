import {Repo} from "../../core/infra/Repo";
import {Incident} from "../../domain/incident/incident";
import {Severity} from "../../domain/incidentTypes/severity";

export default interface IIncidentRepo extends Repo<Incident> {
    deleteIncident(incidentCode: string): Promise<void>;
    findByCode(code: string): Promise<Incident | null>;
    findAll(): Promise<Incident[]>;
    findByVVE(vveCode: string): Promise<Incident[]>;
    getByDataRange(startDateRange : Date, endDateRange : Date): Promise<Incident[]>;
    getBySeverity(severity: Severity): Promise<Incident[]>;
    getResolvedIncidents(): Promise<Incident[]>;
    getActiveIncidents(): Promise<Incident[]>;
}