import { BaseController } from "../../core/infra/BaseController";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import { IVesselVisitExecutionDTO } from "../../dto/IVesselVisitExecutionDTO";

@Service()
export default class CreateVVEController extends BaseController {
    constructor(
        @Inject("VesselVisitExecutionService")
        private vveService: IVesselVisitExecutionService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const { vvnId, actualArrivalTime, creatorEmail } = this.req.body;
            const email = (this.req as any).currentUser?.email || creatorEmail;

            if (!email) {
                return this.clientError("E-mail do utilizador é obrigatório.");
            }

            const dto: IVesselVisitExecutionDTO = {
                vvnId,
                actualArrivalTime: new Date(actualArrivalTime),
                creatorEmail: email
            } as IVesselVisitExecutionDTO;

            const result = await this.vveService.createAsync(dto);
            return this.ok(this.res, result.getValue());

        } catch (e) {
            if (e instanceof BusinessRuleValidationError) {
                return this.clientError(e.message);
            }

            if (typeof e === 'string') {
                return this.clientError(e);
            }

            this.logger.error("Erro inesperado ao criar VVE", { e });
            return this.fail("Erro interno do servidor");
        }
    }
}