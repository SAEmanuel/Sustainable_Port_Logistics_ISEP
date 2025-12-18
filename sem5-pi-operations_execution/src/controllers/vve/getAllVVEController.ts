import { BaseController } from "../../core/infra/BaseController";
import { Inject, Service } from "typedi";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";

@Service()
export default class GetAllVVEController extends BaseController {
    constructor(
        @Inject("VesselVisitExecutionService")
        private vveService: IVesselVisitExecutionService
    ) {
        super();
    }

    protected async executeImpl(): Promise<any> {
        try {
            const result = await this.vveService.getAllAsync();
            return this.ok(this.res, result.getValue());
        } catch (e) {
            return this.fail("Erro ao listar VVEs");
        }
    }
}