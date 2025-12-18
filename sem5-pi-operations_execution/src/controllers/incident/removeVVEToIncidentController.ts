import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";

@Service()
export default class UpdateIncidentController extends BaseController{

    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger

    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const incidentCode = this.req.query.incidentCode as string;
        const vveCode = this.req.query.vveCode as string;

        try {
            const result = await this.incidentService.removeVVEAsync(incidentCode,vveCode);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation while removing vve to Incident", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error(
                "Unexpected error removing vve to incident",
                { e }
            );

            return this.fail("Internal server error");
        }
    }
}