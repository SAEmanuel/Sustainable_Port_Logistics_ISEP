import {Result} from "../../core/logic/Result";
import {IVesselVisitExecutionDTO} from "../../dto/IVesselVisitExecutionDTO";
import {VesselVisitExecutionId} from "../../domain/vesselVisitExecution/vesselVisitExecutionId";
import {VesselVisitExecutionCode} from "../../domain/vesselVisitExecution/vesselVisitExecutionCode";

export default interface IVesselVisitExecutionService {
    createAsync(dto: IVesselVisitExecutionDTO): Promise<Result<IVesselVisitExecutionDTO>>;

    getAllAsync(): Promise<Result<IVesselVisitExecutionDTO[]>>;

    getByIdAsync(id: VesselVisitExecutionId): Promise<Result<IVesselVisitExecutionDTO>>;

    getByCodeAsync(code: VesselVisitExecutionCode): Promise<Result<IVesselVisitExecutionDTO>>;

    getByImoAsync(imo: string): Promise<Result<IVesselVisitExecutionDTO[]>>;
}