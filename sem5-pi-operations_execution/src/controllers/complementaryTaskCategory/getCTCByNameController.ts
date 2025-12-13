import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import IComplementaryTaskCategoryService from "../../services/IServices/IComplementaryTaskCategoryService";
import {Logger} from "winston";

@Service()
export default class GetCTCByNameController extends BaseController {

    constructor(
        @Inject("ComplementaryTaskCategoryService")
        private ctcService: IComplementaryTaskCategoryService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<void> {
        const name = this.req.query.name as string;

        const result = await this.ctcService.getByNameAsync(name);

        if (result.isFailure) {
            const error = result.errorValue();

            this.clientError(
                typeof error === "string"
                    ? error
                    : "Error getting by name complementary task category"
            );
            return;
        }

        this.ok(this.res, result.getValue());
    }
}