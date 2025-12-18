import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";
import {Severity} from "../../domain/incidentTypes/severity";

@Service()
export default class UpdateIncidentController extends BaseController{

    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger

    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const severity = this.req.query.severity as Severity;

        try {
            const result = await this.incidentService.getBySeverityAsync(severity);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation while getting Incident by severity", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error(
                "Unexpected error getting incident by severity",
                { e }
            );

            return this.fail("Internal server error");
        }
    }
}