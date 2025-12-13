import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import {BaseController} from "../../core/infra/BaseController";
import {Inject, Service} from "typedi";
import {Logger} from "winston";
import {IComplementaryTaskCategoryDTO} from "../../dto/IComplementaryTaskCategoryDTO";

@Service()
export default class CreateComplementaryTaskCategoryController
    extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<void> {
        const dto = this.req.body as IComplementaryTaskCategoryDTO;

        const result = await this.ctcService.createAsync(dto);

        if (result.isFailure) {
            const error = result.errorValue();

            this.clientError(
                typeof error === "string"
                    ? error
                    : "Error creating complementary task category"
            );
            return;
        }

        this.ok(this.res, result.getValue());
    }
}