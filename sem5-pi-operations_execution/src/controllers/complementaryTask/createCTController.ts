import { BaseController } from "../../core/infra/BaseController";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import IComplementaryTaskService from "../../services/IServices/IComplementaryTaskService";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import {
    ICreateComplementaryTaskDTO,
} from "../../dto/IComplementaryTaskDTO";

@Service()
export default class CreateCTController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskService")
        private ctService: IComplementaryTaskService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const dto = this.req.body as ICreateComplementaryTaskDTO;
            const result = await this.ctService.createAsync(dto);
            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation on create", {
                    message: e.message,
                    details: e.details
                });
                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error creating ComplementaryTask", { e });
            return this.fail("Internal server error");
        }
    }
}