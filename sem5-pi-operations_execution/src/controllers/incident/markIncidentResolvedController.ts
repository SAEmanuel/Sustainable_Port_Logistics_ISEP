import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";

@Service()
export default class MarkIncidentResolvedController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const incidentCode = this.req.params.incidentCode || this.req.query.incidentCode as string;

        try {
            const result = await this.incidentService.markAsResolvedAsync(incidentCode);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error marking incident as solved", { e });
            return this.fail("Internal server error");
        }
    }
}