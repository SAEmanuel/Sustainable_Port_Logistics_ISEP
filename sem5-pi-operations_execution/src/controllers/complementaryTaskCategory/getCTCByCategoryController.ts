import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import {Logger} from "winston";
import {Category} from "../../domain/complementaryTaskCategory/category";

@Service()
export default class GetCTCByCategoryController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<void> {
        const category = this.req.query.category as Category;

        const result = await this.ctcService.getByCategoryAsync(category);

        if (result.isFailure) {
            const error = result.errorValue();

            this.clientError(
                typeof error === "string"
                    ? error
                    : "Error getting by category complementary task category"
            );
            return;
        }

        this.ok(this.res, result.getValue());
    }
}