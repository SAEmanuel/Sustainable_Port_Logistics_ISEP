import { Result } from "../../core/logic/Result";
import { IVesselVisitExecutionDTO } from "../../dto/IVesselVisitExecutionDTO";

export default interface IVesselVisitExecutionService {
    createAsync(dto: IVesselVisitExecutionDTO): Promise<Result<IVesselVisitExecutionDTO>>;
    getAllAsync(): Promise<Result<IVesselVisitExecutionDTO[]>>;
}