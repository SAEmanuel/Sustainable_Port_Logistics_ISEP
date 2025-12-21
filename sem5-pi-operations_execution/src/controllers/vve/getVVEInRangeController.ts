import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";

@Service()
export default class GetVVEInRangeController extends BaseController {

    constructor(
        @Inject("VesselVisitExecutionService")
        private vveService: IVesselVisitExecutionService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        this.logger.info("HTTP GET /api/vve/in-range");

        const { timeStart, timeEnd } = this.req.query;

        if (!timeStart || !timeEnd) {
            return this.clientError("timeStart and timeEnd are required");
        }

        const startDate = new Date(Number(timeStart));
        const endDate = new Date(Number(timeEnd));

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return this.clientError("Invalid date range.");
        }

        try {
            const result = await this.vveService.getInRangeAsync(startDate, endDate);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation on getInRange vve", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unhandled error in GetVVEInRangeController", {
                error: (e as Error).message,
                stack: (e as Error).stack
            });

            return this.fail("Internal server error");
        }
    }
}