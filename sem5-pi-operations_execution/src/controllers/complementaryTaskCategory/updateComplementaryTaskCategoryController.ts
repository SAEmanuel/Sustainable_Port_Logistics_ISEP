import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import { Logger } from "winston";
import { IComplementaryTaskCategoryDTO } from "../../dto/IComplementaryTaskCategoryDTO";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

@Service()
export default class UpdateComplementaryTaskCategoryController
    extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const code = this.req.params.code;
        const dto = this.req.body as IComplementaryTaskCategoryDTO;

        try {
            const result = await this.ctcService.updateAsync(code, dto);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation updating ComplementaryTaskCategory", {
                    message: e.message,
                    details: e.details,
                    code
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error updating ComplementaryTaskCategory", {
                code,
                error: e
            });

            return this.fail("Internal server error");
        }
    }
}