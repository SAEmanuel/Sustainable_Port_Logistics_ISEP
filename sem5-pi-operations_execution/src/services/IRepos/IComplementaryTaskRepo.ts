import { Repo } from "../../core/infra/Repo";
import { ComplementaryTask } from "../../domain/complementaryTask/complementaryTask";
import {ComplementaryTaskCode} from "../../domain/complementaryTask/ComplementaryTaskCode";
import {ComplementaryTaskCategoryId} from "../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {VesselVisitExecutionId} from "../../domain/vesselVisitExecution/vesselVisitExecutionId";
import {CTStatus} from "../../domain/complementaryTask/ctstatus";



export default interface IComplementaryTaskRepo extends Repo<ComplementaryTask> {
    findByCode(code: ComplementaryTaskCode): Promise<ComplementaryTask | null>;
    findAll(): Promise<ComplementaryTask[]>;
    findByCategory(category: ComplementaryTaskCategoryId): Promise<ComplementaryTask[]>
    findByStaff(staff: string): Promise<ComplementaryTask[]>
    findByVve(vve: VesselVisitExecutionId): Promise<ComplementaryTask[]>
    findCompleted(status : CTStatus): Promise<ComplementaryTask[]>
    findInProgress(status : CTStatus): Promise<ComplementaryTask[]>
    findScheduled(status : CTStatus): Promise<ComplementaryTask[]>
    findInRange(startDate: Date, endDate : Date): Promise<ComplementaryTask[]>
    getNextSequenceNumber() : Promise<number>

}