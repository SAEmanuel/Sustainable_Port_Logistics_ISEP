import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";
import {IIncidentDTO} from "../../dto/IIncidentDTO";

@Service()
export default class CreateIncidentController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const dto = this.req.body as IIncidentDTO;

        try {
            const result = await this.incidentService.createAsync(dto);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error creating Incident", { e });
            return this.fail("Internal server error");
        }
    }
}