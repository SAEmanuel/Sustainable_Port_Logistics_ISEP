import { OperationPlan } from "../../domain/operationPlan/operationPlan";

export default interface IOperationPlanRepo {
    findByDomainId(domainId: string): Promise<OperationPlan | null>;
    exists(plan: OperationPlan): Promise<boolean>;
    save(plan: OperationPlan): Promise<OperationPlan>;

    search(startDate?: Date, endDate?: Date, vessel?: string): Promise<OperationPlan[]>;

    searchByCraneAndInterval(
        startDate: Date,
        endDate: Date,
        craneId?: string
    ): Promise<OperationPlan[]>;

    findOperationByVvnId(vvnId: string): Promise<any | null>;

    findLatestByVvnId(vvnId: string): Promise<OperationPlan | null>;
}
