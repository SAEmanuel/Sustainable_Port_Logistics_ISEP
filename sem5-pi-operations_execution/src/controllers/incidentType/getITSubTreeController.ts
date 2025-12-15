import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IIncidentTypeService from "../../services/IServices/IIncidentTypeService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

@Service()
export default class GetITSubTreeController extends BaseController {
    constructor(
        @Inject("IncidentTypeService") private incidentTypeService: IIncidentTypeService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const parentCode =
            (this.req.params.parentCode as string) ||
            (this.req.params.code as string) ||
            (this.req.query.parentCode as string);

        try {
            if (!parentCode) {
                return this.clientError("parentCode is required");
            }

            const result = await this.incidentTypeService.getSubTreeFromParentNode(parentCode);
            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation while getting IT subtree", {
                    message: e.message,
                    details: e.details,
                    parentCode
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error getting IT subtree", {
                parentCode,
                error: e
            });

            return this.fail("Internal server error");
        }
    }
}
