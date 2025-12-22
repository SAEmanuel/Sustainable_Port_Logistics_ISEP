import {Repo} from "../../core/infra/Repo";
import {IncidentType} from "../../domain/incidentTypes/incidentType";

export default interface IIncidentTypeRepository extends Repo<IncidentType> {
    findByCode(code: string): Promise<IncidentType | null>;
    findByName(name: string): Promise<IncidentType[]>;
    getDirectChilds(parentCode: string): Promise<IncidentType[]>;
    getSubTreeFromParentNode(parentCode: string): Promise<IncidentType[]>;
    getRootTypes(): Promise<IncidentType[]>;
    removeType(incidentTypeCode: string): Promise<number>;
    getAllAsyn(): Promise<IncidentType[]>;

}

