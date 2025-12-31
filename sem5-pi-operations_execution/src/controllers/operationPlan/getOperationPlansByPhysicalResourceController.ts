import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import OperationPlanService from "../../services/operationPlanService";
import { IOperationPlanDTO, IOperationDTO } from "../../dto/IOperationPlanDTO";

@Service()
export default class GetOperationPlansByPhysicalResourceController extends BaseController {
    constructor(
        @Inject("OperationPlanService") private service: OperationPlanService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const crane = this.req.query.crane as string;
        const startDateStr = this.req.query.startDate as string;
        const endDateStr = this.req.query.endDate as string;

        if (!crane || !startDateStr || !endDateStr) {
            return this.clientError("Missing required query parameters: crane, startDate, endDate");
        }

        try {
            // Get plans wrapped in Result
            const result = await this.service.getPlansByCraneAsync(crane, startDateStr, endDateStr);

            if (result.isFailure) {
                return this.fail("Failed to get operation plans");
            }

            const plans: IOperationPlanDTO[] = result.getValue();

            //Map each plan to extract operations for this crane
            const mapped = plans.map((plan: IOperationPlanDTO) => {
                const operationsForCrane: IOperationDTO[] = plan.operations.filter(
                    (op: IOperationDTO) => op.crane === crane
                );

                const totalAllocationTime = operationsForCrane.reduce(
                    (sum: number, op: IOperationDTO) => sum + (op.loadingDuration || 0) + (op.unloadingDuration || 0),
                    0
                );

                return {
                    planDate: plan.planDate,
                    algorithm: plan.algorithm,
                    status: plan.status,
                    totalAllocationTime,
                    numberOfOperations: operationsForCrane.length,
                    operations: operationsForCrane
                };
            }).filter(plan => plan.operations.length > 0); // Only plans where crane was used

            return this.ok(this.res,mapped);
        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation on getByPhysicalResource", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unhandled error in GetByPhysicalResourceController", {
                error: (e as Error).message || e,
                stack: (e as Error).stack
            });

            return this.fail("Internal server error");
        }
    }
}
