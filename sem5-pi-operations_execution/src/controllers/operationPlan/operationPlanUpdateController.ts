import { Request, Response, NextFunction } from "express";
import { Container, Service } from "typedi";
import OperationPlanService from "../../services/operationPlanService";

@Service()
export default class OperationPlanUpdateController {
    public async updateForVvn(req: Request, res: Response, next: NextFunction) {
        try {
            const service = Container.get(OperationPlanService);

            const author =
                req.body?.author ||
                (req as any).user?.name ||
                (req as any).user?.id ||
                "Unknown";

            const result = await service.updatePlanForVvnAsync(req.body, author);

            if (result.isFailure) {
                const raw = (result as any).errorValue?.();
                const msg =
                    typeof raw === "string" && raw.trim().length > 0
                        ? raw
                        : "Erro ao atualizar Operation Plan.";

                return res.status(409).json({ message: msg });
            }

            return res.status(200).json(result.getValue());
        } catch (e) {
            return next(e);
        }
    }

    public async updateBatch(req: Request, res: Response, next: NextFunction) {
        try {
            const service = Container.get(OperationPlanService);

            const author =
                req.body?.author ||
                (req as any).user?.name ||
                (req as any).user?.id ||
                "Unknown";

            const result = await service.updatePlanBatchAsync(req.body, author);

            if (result.isFailure) {
                const raw = (result as any).errorValue?.();
                const msg =
                    typeof raw === "string" && raw.trim().length > 0
                        ? raw
                        : "Erro ao atualizar Operation Plan (batch).";

                return res.status(409).json({ message: msg });
            }

            return res.status(200).json(result.getValue());
        } catch (e) {
            return next(e);
        }
    }
}
