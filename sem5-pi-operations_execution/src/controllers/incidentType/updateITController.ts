import {Inject, Service} from "typedi";
import {BaseController} from "../../core/infra/BaseController";
import IIncidentTypeService from "../../services/IServices/IIncidentTypeService";
import {Logger} from "winston";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";
import {IIncidentTypeDTO} from "../../dto/IIncidentTypeDTO";

@Service()
export default class UpdateITController extends BaseController{

    constructor(
        @Inject("IncidentTypeService") private incidentTypeService: IIncidentTypeService,
        @Inject("logger") private logger: Logger

    ) {
        super();
    }


    protected async executeImpl(): Promise<any> {
        const code = this.req.params.code;
        const dto = this.req.body as IIncidentTypeDTO;

        try {
            const result = await this.incidentTypeService.updateAsync(code, dto);

            return this.ok(this.res, result.getValue());

        } catch (e) {

            if (e instanceof BusinessRuleValidationError) {
                this.logger.warn("Business rule violation updating Incident Type", {
                    message: e.message,
                    details: e.details,
                    code
                });

                return this.clientError(e.message);
            }

            this.logger.error("Unexpected error updating Incident Type", {
                code,
                error: e
            });

            return this.fail("Internal server error");
        }
    }

}