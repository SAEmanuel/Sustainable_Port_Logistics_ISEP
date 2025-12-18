import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";
import {Severity} from "../../domain/incidentTypes/severity";

@Service()
export default class GetIncidentsBySeverityController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const severity = this.req.query.severity as unknown as Severity;

        try {
            const result = await this.incidentService.getBySeverityAsync(severity);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error getting incident by severity", { e });
            return this.fail("Internal server error");
        }
    }
}