import { Inject, Service } from "typedi";
import { BaseController } from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import {ComplementaryTaskCategoryId} from "../../domain/complementaryTaskCategory/complementaryTaskCategoryId";

@Service()
export default class GetCTCByIdController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const id = this.req.params.id;

        if (!id) {
            return this.clientError("CTC id is required");
        }

        try {
            const result = await this.ctcService.getByIdAsync(
                ComplementaryTaskCategoryId.create(id)
            );

            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error fetching CTC by id", { e });
            return this.fail("Internal server error");
        }
    }
}