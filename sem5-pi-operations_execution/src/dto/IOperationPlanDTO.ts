
export interface IOperationDTO {
    vvnId: string;
    vessel: string;
    dock: string;
    startTime: number;
    endTime: number;
    loadingDuration: number;
    unloadingDuration: number;
    crane: string;
    craneCountUsed: number;
    totalCranesOnDock: number;
    optimizedOperationDuration: number;
    realDepartureTime: number;
    realArrivalTime: number;
    departureDelay: number;
    staffAssignments?: any[];
    executionStatus?: "started" | "completed" | "delayed";
    actualStartTime?: number;
    actualEndTime?: number;
    resourcesUsed?: Array<{ resourceId: string; quantity?: number; hours?: number }>;
    executionUpdatedAt?: number;
    executionUpdatedBy?: string;
    executionNote?: string;

}

export interface IOperationPlanDTO {
    domainId?: string;
    algorithm: string;         // Algoritmo usado
    totalDelay: number;        // total_delay
    status: string;            // status
    operations: IOperationDTO[]; // best_sequence
    planDate: Date;            // A "target day" escolhida pelo utilizador
    createdAt?: Date;          // Metadata
    author?: string;           // Metadata (Quem salvou)
}