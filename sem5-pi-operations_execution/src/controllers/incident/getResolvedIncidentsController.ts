import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";

@Service()
export default class GetResolvedIncidentsController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const result = await this.incidentService.getResolvedIncidentsAsync();

            if (result.isFailure) {
                return this.fail(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error getting resolved incidents", { e });
            return this.fail("Internal server error");
        }
    }
}