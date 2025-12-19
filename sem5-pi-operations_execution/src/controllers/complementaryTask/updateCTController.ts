import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import IComplementaryTaskService from "../../services/IServices/IComplementaryTaskService";
import {IComplementaryTaskDTO} from "../../dto/IComplementaryTaskDTO";
import {ComplementaryTaskCode} from "../../domain/complementaryTask/ComplementaryTaskCode";

@Service()
export default class UpdateCTController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskService")
        private ctService: IComplementaryTaskService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const code = this.req.params.code;
        const dto = this.req.body as IComplementaryTaskDTO;

        try {
            if (!code) {
                return this.clientError("Code is required");
            }

            const result = await this.ctService.updateAsync(ComplementaryTaskCode.createFromString(code), dto);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation updating ComplementaryTask", {
                    message: e.message,
                    details: e.details,
                    code
                });
                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error updating ComplementaryTask", {
                code,
                error: e
            });

            return this.fail("Internal server error");
        }
    }
}