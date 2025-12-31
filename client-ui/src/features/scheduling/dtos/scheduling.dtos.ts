export interface StaffAssignmentDto {
    staffMemberName: string;
    intervalStart: string;
    intervalEnd: string;
}

export interface SchedulingOperationDto {
    vvnId: string;
    vessel: string;
    dock: string;

    startTime: number;
    endTime: number;

    loadingDuration: number;
    unloadingDuration: number;

    crane: string;
    staffAssignments: StaffAssignmentDto[];

    craneCountUsed: number;
    totalCranesOnDock?: number;

    optimizedOperationDuration: number;
    realDepartureTime: number;
    realArrivalTime: number;
    departureDelay: number;

    theoreticalRequiredCranes?: number;
    resourceSuggestion?: string;
}

export interface SaveScheduleDto {
    planDate: string;
    author: string;
    algorithm: string;
    total_delay: number;
    status: string;
    operations: SchedulingOperationDto[];
}

export interface OperationPlanFilterDTO {
    startDate?: string;
    endDate?: string;
    vessel?: string;
}

export type OperationPlanWarningDto = {
    code: string;
    message: string;
    severity: "info" | "warning" | "blocking";
};

export interface UpdateOperationPlanForVvnDto {
    planDomainId: string;
    vvnId: string;
    reasonForChange: string;
    author: string;
    operations: SchedulingOperationDto[];
}

export interface UpdateOperationPlanResultDto {
    plan: any;
    warnings: OperationPlanWarningDto[];
}
export interface UpdateOperationPlanVvnChangeDto {
    vvnId: string;
    reasonForChange: string;
    status?: string;
    operations: any[];
}

export interface UpdateOperationPlanForVvnsBatchDto {
    planDomainId: string;
    author: string;
    changes: UpdateOperationPlanVvnChangeDto[];
}

export interface UpdateOperationPlanBatchResultDto {
    plan: any;
    warnings: OperationPlanWarningDto[];
}
