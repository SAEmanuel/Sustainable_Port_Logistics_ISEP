import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import {Logger} from "winston";

@Service()
export default class ActivateComplementaryTaskCategoryController
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

        const result = await this.ctcService.activateAsync(code);

        if (result.isFailure) {
            const error = result.errorValue();

            this.clientError(
                typeof error === "string"
                    ? error
                    : "Error activating complementary task category"
            );
            return;
        }

        this.ok(this.res, result.getValue());
    }
}