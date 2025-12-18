import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";

@Service()
export default class RemoveVVEFromIncidentController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        const incidentCode = this.req.params.incidentCode || this.req.query.incidentCode as string;
        const vveCode = this.req.params.vveCode || this.req.query.vveCode as string;

        try {
            const result = await this.incidentService.removeVVEAsync(incidentCode, vveCode);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error removing vve from incident", { e });
            return this.fail("Internal server error");
        }
    }
}