export type OperationExecutionStatus = "started" | "completed" | "delayed";

export interface ExecutedOperationResourceUsage {
    resourceId: string;
    quantity?: number;
    hours?: number;
}

export interface ExecutedOperation {
    plannedOperationId: string;
    actualStart?: Date;
    actualEnd?: Date;
    resourcesUsed?: ExecutedOperationResourceUsage[];
    status: OperationExecutionStatus;
    note?: string;

    updatedAt: Date;
    updatedBy: string;
}
