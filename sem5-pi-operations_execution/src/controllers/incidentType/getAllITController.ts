import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentTypeService from "../../services/IServices/IIncidentTypeService";

@Service()
export default class GetAllITController extends BaseController {
    constructor(
        @Inject("IncidentTypeService") private incidentTypeService: IIncidentTypeService,
        @Inject("logger") private logger: Logger

    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const result = await this.incidentTypeService.getAllAsync();

            if (result.isFailure) {
                return this.fail(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error getting all incidents types", { e });
            return this.fail("Internal server error");
        }
    }
}