import {Repo} from "../../core/infra/Repo";
import {Incident} from "../../domain/incident/incident";
import {IIncidentDTO} from "../../dto/IIncidentDTO";

export default interface IIncidentRepo extends Repo<Incident> {
    findByCode(code: string): Promise<Incident | null>;
    findAll(): Promise<Incident[]>
}