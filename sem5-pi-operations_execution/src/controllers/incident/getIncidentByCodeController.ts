import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";

@Service()
export default class GetIncidentByCodeController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const incidentCode = this.req.params.code ? this.req.params.code : this.req.query.incidentCode as string;

        try {
            const result = await this.incidentService.getByCodeAsync(incidentCode);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error getting incident by code", { e });
            return this.fail("Internal server error");
        }
    }
}