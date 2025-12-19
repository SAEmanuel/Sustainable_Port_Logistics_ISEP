import {Result} from "../../core/logic/Result";
import {
    IComplementaryTaskDTO, ICreateComplementaryTaskDTO, IUpdateComplementaryTaskDetailsDTO,
    IUpdateComplementaryTaskStatusDTO
} from "../../dto/IComplementaryTaskDTO";
import {ComplementaryTaskCode} from "../../domain/complementaryTask/ComplementaryTaskCode";
import {ComplementaryTaskCategoryId} from "../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {VesselVisitExecutionId} from "../../domain/vesselVisitExecution/vesselVisitExecutionId";

export default interface IComplementaryTaskService {

    createAsync(dto: ICreateComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>>;

    updateAsync(code: ComplementaryTaskCode, dto: IUpdateComplementaryTaskDetailsDTO): Promise<Result<IComplementaryTaskDTO>>;

    updateStatusAsync(code: ComplementaryTaskCode, dto: IUpdateComplementaryTaskStatusDTO): Promise<Result<IComplementaryTaskDTO>>;

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