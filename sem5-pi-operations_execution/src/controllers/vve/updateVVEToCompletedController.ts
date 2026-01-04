import { Request, Response, NextFunction } from "express";
import { Inject, Service } from "typedi";
import IVesselVisitExecutionService from "../../services/IServices/IVesselVisitExecutionService";
import { VesselVisitExecutionCode } from "../../domain/vesselVisitExecution/vesselVisitExecutionCode";

@Service()
export default class UpdateVVEToCompletedController {
  constructor(
    @Inject("VesselVisitExecutionService")
    private vveService: IVesselVisitExecutionService
  ) {}

  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      const code = VesselVisitExecutionCode.create(req.params.code);

      const {
        actualUnBerthTime,
        actualLeavePortTime,
        updaterEmail,
      } = req.body;

      const result = await this.vveService.setCompletedAsync(
        code,
        new Date(actualUnBerthTime),
        new Date(actualLeavePortTime),
        updaterEmail
      );

      if (result.isFailure) {
        return res.status(400).json({
          message: String(result.errorValue()),
        });
      }

      return res.status(200).json(result.getValue());
    } catch (err) {
      return next(err);
    }
  }
}
