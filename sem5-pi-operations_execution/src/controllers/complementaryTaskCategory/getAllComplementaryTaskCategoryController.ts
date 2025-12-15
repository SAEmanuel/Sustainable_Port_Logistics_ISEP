import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

@Service()
export default class GetAllComplementaryTaskCategoryController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        this.logger.info("HTTP GET /api/complementary-task-categories");

        try {
            this.logger.debug("Calling ctcService.getAllAsync().");
            const result = await this.ctcService.getAllAsync();


            if (result.isFailure) {
                this.logger.warn("CTC fetch failed at Service level.", {
                    reason: result.error,
                });

                return this.clientError(
                    result.error?.toString() ?? "Unknown error at service level"
                );
            }

            this.logger.info("Successfully fetched all CTCs. Sending HTTP 200 OK.");
            return this.ok(this.res, result.getValue());

        } catch (e) {


            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation on getAll CTC", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unhandled error in GetAllComplementaryTaskCategoryController", {
                error: (e as Error).message || e,
                stack: (e as Error).stack
            });

            return this.fail("Internal server error");
        }
    }
}