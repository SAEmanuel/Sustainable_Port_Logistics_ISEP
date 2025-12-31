import { IOperationDTO } from "./IOperationPlanDTO";
import type { IOperationPlanDTO } from "./IOperationPlanDTO";

export interface IUpdateOperationPlanForVvnDTO {
    planDomainId: string;
    vvnId: string;
    reasonForChange: string;
    author: string;
    operations: IOperationDTO[];
}

export type InconsistencySeverity = "info" | "warning" | "blocking";

export interface IPlanInconsistencyDTO {
    severity: InconsistencySeverity;
    code: string;
    message: string;
    relatedVvnIds?: string[];
}

export interface IUpdateOperationPlanResultDTO {
    plan: IOperationPlanDTO;
    warnings: IPlanInconsistencyDTO[];
}
