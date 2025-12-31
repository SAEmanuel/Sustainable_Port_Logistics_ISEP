import { IOperationDTO, IOperationPlanDTO } from "./IOperationPlanDTO";
import { IPlanInconsistencyDTO } from "./IUpdateOperationPlanDTO";

export interface IUpdateOperationPlanForVvnPatchDTO {
    vvnId: string;
    operations: IOperationDTO[];
}

export interface IUpdateOperationPlanBatchDTO {
    planDomainId: string;
    reasonForChange: string;
    author: string;
    updates: IUpdateOperationPlanForVvnPatchDTO[];
}

export interface IUpdateOperationPlanBatchResultDTO {
    plan: IOperationPlanDTO;
    warnings: IPlanInconsistencyDTO[];
}
