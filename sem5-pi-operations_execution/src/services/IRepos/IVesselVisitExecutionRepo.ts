import { Repo } from "../../core/infra/Repo";
import { VesselVisitExecution } from "../../domain/vesselVisitExecution/vesselVisitExecution";
import {VesselVisitExecutionCode} from "../../domain/vesselVisitExecution/vesselVisitExecutionCode";

export default interface IVesselVisitExecutionRepo extends Repo<VesselVisitExecution> {
    save(vve: VesselVisitExecution): Promise<VesselVisitExecution>;
    findByVvnId(vvnId: string): Promise<VesselVisitExecution | null>;
    getNextSequenceNumber(): Promise<number>;
    findAll(): Promise<VesselVisitExecution[]>;
    findByCode(code: VesselVisitExecutionCode) : Promise<VesselVisitExecution | null>;
    getAllInDateRange(startDate: Date, endDate: Date): Promise<VesselVisitExecution[]>;
}