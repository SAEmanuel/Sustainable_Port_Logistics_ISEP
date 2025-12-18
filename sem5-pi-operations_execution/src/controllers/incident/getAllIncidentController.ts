import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";
import {IIncidentDTO} from "../../dto/IIncidentDTO";

@Service()
export default class UpdateIncidentController extends BaseController{

    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger

    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {

        try {
            const result = await this.incidentService.getAllIncidentAsync();

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation while getting all Incident", {
                    message: e.message,
                    details: e.details
                });

                return this.clientError(e.message);
            }

            this.logger.error(
                "Unexpected error getting all incident",
                { e }
            );

            return this.fail("Internal server error");
        }
    }
}