import { BaseController } from "../../core/infra/BaseController";
import { Inject, Service } from "typedi";
import OperationPlanService from "../../services/operationPlanService";
import { IOperationPlanDTO } from "../../dto/IOperationPlanDTO";

@Service()
export default class CreateOperationPlanController extends BaseController {
    constructor(
        @Inject("OperationPlanService") private service: OperationPlanService
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const body = this.req.body;

            const userEmail = (this.req as any).currentUser?.email || body.author || "system_test";

            const dto: IOperationPlanDTO = {
                algorithm: body.algorithm,
                totalDelay: body.total_delay || body.totalDelay,
                status: body.status,
                operations: body.best_sequence || body.operations,
                planDate: new Date(body.planDate || new Date()),
                author: userEmail,
            } as IOperationPlanDTO;

            const result = await this.service.createPlanAsync(dto);

            if (result.isFailure) {
                return this.clientError(result.errorValue().toString());
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            // @ts-ignore
            return this.fail(e);
        }
    }
}