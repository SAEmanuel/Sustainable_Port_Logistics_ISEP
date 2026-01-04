import { BaseController } from "../../core/infra/BaseController";
import { Inject, Service } from "typedi";
import OperationPlanService from "../../services/operationPlanService";
import { IOperationPlanDTO } from "../../dto/IOperationPlanDTO";

@Service()
export default class GetOperationPlansController extends BaseController {
    constructor(
        @Inject("OperationPlanService")
        private service: OperationPlanService
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const startDate = this.req.query.startDate as string;
            const endDate = this.req.query.endDate as string;
            const vessel = this.req.query.vessel as string;

            const result = await this.service.getPlansAsync(startDate, endDate, vessel);

            if (result.isFailure) {
                return this.clientError(result.errorValue().toString());
            }

            return this.ok<IOperationPlanDTO[]>(this.res, result.getValue());
        } catch (e) {
            if (!this.res.headersSent) {
                // @ts-ignore
                return this.fail(e);
            } else {
                console.error("Attempted to fail after headers sent:", e);
            }
        }
    }
}