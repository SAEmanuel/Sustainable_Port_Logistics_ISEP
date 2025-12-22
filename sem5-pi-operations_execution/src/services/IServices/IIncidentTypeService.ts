import {Result} from "../../core/logic/Result";
import {IIncidentTypeDTO} from "../../dto/IIncidentTypeDTO";

export default interface IIncidentTypeService {
    getRootTypes(): Promise<Result<IIncidentTypeDTO[]>>;

    getDirectChilds(parentCode: string): Promise<Result<IIncidentTypeDTO[]>>;

    getSubTreeFromParentNode(parentCode: string): Promise<Result<IIncidentTypeDTO[]>>;

    getByName(name: string): Promise<Result<IIncidentTypeDTO[]>>;

    getByCode(code: string): Promise<Result<IIncidentTypeDTO>>;

    updateAsync(code: string, dto: IIncidentTypeDTO): Promise<Result<IIncidentTypeDTO>>;

    createAsync(dto: IIncidentTypeDTO): Promise<Result<IIncidentTypeDTO>>;

    removeAsync(incidentTypeCode: string): Promise<Result<void>>;

    getAllAsync(): Promise<Result<IIncidentTypeDTO[]>>;
}