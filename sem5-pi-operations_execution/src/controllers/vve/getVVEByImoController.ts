import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";
@Service()
export default class GetVVEByImoController extends BaseController {

    constructor(
        @Inject("VesselVisitExecutionService")
        private vveService: IVesselVisitExecutionService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const imo = this.req.params.imo;

        if (!imo) {
            return this.clientError("VVE imo is required");
        }

        try {
            const result = await this.vveService.getByImoAsync(imo);

            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error fetching VVE by imo", { e });
            return this.fail("Internal server error");
        }
    }
}


