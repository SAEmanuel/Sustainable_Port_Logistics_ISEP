import {Result} from "../../core/logic/Result";
import {
    IComplementaryTaskDTO, IHandleComplementaryTaskDTO
} from "../../dto/IComplementaryTaskDTO";
import {ComplementaryTaskCode} from "../../domain/complementaryTask/ComplementaryTaskCode";
import {ComplementaryTaskCategoryId} from "../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {VesselVisitExecutionId} from "../../domain/vesselVisitExecution/vesselVisitExecutionId";

export default interface IComplementaryTaskService {

    createAsync(dto: IHandleComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>>;

    updateAsync(code: ComplementaryTaskCode, dto: IHandleComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>>;

    getAllAsync(): Promise<Result<IComplementaryTaskDTO[]>>;

    getByCodeAsync(code: ComplementaryTaskCode): Promise<Result<IComplementaryTaskDTO>>;

    getByStaffAsync(staff: string): Promise<Result<IComplementaryTaskDTO[]>>;

    getByCategoryAsync(category: ComplementaryTaskCategoryId): Promise<Result<IComplementaryTaskDTO[]>>;

    getInRangeAsync(timeStart: Date, timeEnd: Date): Promise<Result<IComplementaryTaskDTO[]>>;

    getByVveAsync(vve: VesselVisitExecutionId): Promise<Result<IComplementaryTaskDTO>>;

    getScheduledAsync(): Promise<Result<IComplementaryTaskDTO[]>>;

    getInProgressAsync(): Promise<Result<IComplementaryTaskDTO[]>>;

    getCompletedAsync(): Promise<Result<IComplementaryTaskDTO[]>>;

}