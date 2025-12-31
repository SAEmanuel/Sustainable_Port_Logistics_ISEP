import { Service, Inject } from "typedi";
import { Document, Model } from "mongoose";

export interface IOperationPlanChangeLogPersistence {
    planDomainId: string;
    vvnId: string;
    changedAt: Date;
    author: string;
    reasonForChange: string;
    before: any;
    after: any;
}

@Service()
export default class OperationPlanChangeLogRepo {
    constructor(
        @Inject("operationPlanChangeLogSchema")
        private schema: Model<IOperationPlanChangeLogPersistence & Document>
    ) {}

    async append(entry: IOperationPlanChangeLogPersistence): Promise<void> {
        await this.schema.create(entry);
    }

    async findByPlan(planDomainId: string): Promise<IOperationPlanChangeLogPersistence[]> {
        return this.schema.find({ planDomainId }).sort({ changedAt: -1 });
    }

    async findByPlanAndVvn(planDomainId: string, vvnId: string): Promise<IOperationPlanChangeLogPersistence[]> {
        return this.schema.find({ planDomainId, vvnId }).sort({ changedAt: -1 });
    }
}
