import { IOperationDTO } from "./IOperationPlanDTO";

export interface IUpdateOperationPlanForVvnDTO {
    planDomainId: string;          // qual plano (por ex. o “best” desse dia)
    vvnId: string;                 // VVN alvo da alteração
    reasonForChange: string;       // obrigatório (AC)
    status?: string;               // opcional
    operations: IOperationDTO[];   // operações do VVN (substituição total do subset)
}

export type InconsistencySeverity = "info" | "warning" | "blocking";

export interface IPlanInconsistencyDTO {
    severity: InconsistencySeverity;
    code: string;
    message: string;
    relatedVvnIds?: string[];
}

export interface IUpdateOperationPlanResultDTO {
    plan: import("./IOperationPlanDTO").IOperationPlanDTO;
    warnings: IPlanInconsistencyDTO[];
}
