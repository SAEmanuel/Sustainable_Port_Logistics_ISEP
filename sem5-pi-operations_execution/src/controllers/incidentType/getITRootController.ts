import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IIncidentTypeService from "../../services/IServices/IIncidentTypeService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

@Service()
export default class GetITRootTypesController extends BaseController {
    constructor(
        @Inject("IncidentTypeService") private incidentTypeService: IIncidentTypeService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const result = await this.incidentTypeService.getRootTypes();
            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation while getting IT root types", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error getting IT root types", { error: e });
            return this.fail("Internal server error");
        }
    }
}
