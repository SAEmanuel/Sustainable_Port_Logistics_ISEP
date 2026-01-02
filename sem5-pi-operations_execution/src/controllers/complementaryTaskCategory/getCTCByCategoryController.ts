import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import {CategoryFactory} from "../../domain/complementaryTaskCategory/category";

@Service()
export default class GetCTCByCategoryController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const rawCategory = this.req.query.category as string;
            const category = CategoryFactory.fromString(rawCategory);

            const result = await this.ctcService.getByCategoryAsync(category);

            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error getting CTC by category", { e });
            return this.fail("Internal server error");
        }
    }
}