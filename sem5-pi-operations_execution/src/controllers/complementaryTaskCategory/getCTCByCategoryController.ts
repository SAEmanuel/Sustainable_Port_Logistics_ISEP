import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import {Category, CategoryFactory} from "../../domain/complementaryTaskCategory/category";

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
        const category = this.req.query.category as Category;

        try {
            const result = await this.ctcService.getByCategoryAsync(CategoryFactory.fromString(category));

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation getting CTC by category", {
                    message: e.message,
                    details: e.details,
                    category
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error getting CTC by category", {
                category,
                error: e
            });

            return this.fail("Internal server error");
        }
    }
}