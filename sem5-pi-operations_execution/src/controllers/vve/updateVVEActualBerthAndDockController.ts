import { Request, Response, NextFunction } from "express";
import { Inject, Service } from "typedi";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";
import { VesselVisitExecutionId } from "../../domain/vesselVisitExecution/vesselVisitExecutionId";

@Service()
export default class UpdateVVEActualBerthAndDockController {
    constructor(
        @Inject("VesselVisitExecutionService")
        private vveService: IVesselVisitExecutionService
    ) {}

    public async execute(req: Request, res: Response, next: NextFunction) {
        try {
            const id = VesselVisitExecutionId.create(req.params.id);

            const { actualBerthTime, actualDockId, updaterEmail } = req.body;

            const result = await this.vveService.updateBerthAndDockAsync(
                id,
                new Date(actualBerthTime),
                actualDockId,
                updaterEmail
            );

            if (result.isFailure) {
                return res.status(400).json({ message: result.errorValue() });
            }

            return res.status(200).json(result.getValue());
        } catch (e) {
            return next(e);
        }
    }
}
