import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import IComplementaryTaskService from "../../services/IServices/IComplementaryTaskService";
import {IComplementaryTaskStatusDTO} from "../../dto/IComplementaryTaskDTO";
import {ComplementaryTaskCode} from "../../domain/complementaryTask/ComplementaryTaskCode";

@Service()
export default class ChangeCTController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskService")
        private ctService: IComplementaryTaskService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const code = this.req.params.code;
        const dto = this.req.body as IComplementaryTaskStatusDTO;

        try {
            if (!code) {
                return this.clientError("Status is required");
            }

            const result = await this.ctService.updateStatusAsync(ComplementaryTaskCode.createFromString(code), dto);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation updating ComplementaryTask status", {
                    message: e.message,
                    details: e.details,
                    code
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error updating ComplementaryTask status", {
                code,
                error: e
            });

            return this.fail("Internal server error");
        }
    }
}