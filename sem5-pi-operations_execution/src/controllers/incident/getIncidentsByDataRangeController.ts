import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import {Logger} from "winston";
import IIncidentService from "../../services/IServices/IIncidentService";

@Service()
export default class GetIncidentsByDataRangeController extends BaseController {
    constructor(
        @Inject("IncidentService") private incidentService: IIncidentService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        // Conversão explícita de string para Date
        const startDataRange = new Date(this.req.query.startDataRange as string);
        const endDataRange = new Date(this.req.query.endDataRange as string);

        try {
            const result = await this.incidentService.getByDataRangeAsync(startDataRange, endDataRange);

            if (result.isFailure) {
                return this.clientError(result.errorValue() as string);
            }

            return this.ok(this.res, result.getValue());
        } catch (e) {
            this.logger.error("Unexpected error getting incident by dataRange", { e });
            return this.fail("Internal server error");
        }
    }
}