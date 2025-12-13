import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import {Logger} from "winston";
import {IComplementaryTaskCategoryDTO} from "../../dto/IComplementaryTaskCategoryDTO";

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

    protected async executeImpl(): Promise<void> {
        const code = this.req.params.code;
        const dto = this.req.body as IComplementaryTaskCategoryDTO;

        const result = await this.ctcService.updateAsync(code, dto);

        if (result.isFailure) {
            const error = result.errorValue();

            this.clientError(
                typeof error === "string"
                    ? error
                    : "Error updating complementary task category"
            );
            return;
        }

        this.ok(this.res, result.getValue());
    }
}