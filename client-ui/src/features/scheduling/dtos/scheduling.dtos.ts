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

export interface DailyScheduleResultDto {
    operations: SchedulingOperationDto[];
}

export interface OptimizationStepDto {
    stepNumber: number;
    totalDelay: number;
    totalCranesUsed: number;
    algorithmUsed: string;
    changeDescription: string;
}

export interface MultiCraneComparisonResultDto {
    singleCraneSchedule: DailyScheduleResultDto;
    singleCraneProlog: any;

    multiCraneSchedule: DailyScheduleResultDto;
    multiCraneProlog: any;

    singleTotalDelay: number;
    multiTotalDelay: number;

    singleCraneHours: number;
    multiCraneHours: number;

    optimizationSteps: OptimizationStepDto[];
}


export interface PrologOperationResultDto {
    vessel: string;
    start: number;
    end: number;
}


export interface PrologFullResultDto {
    algorithm: string;
    total_delay: number;
    best_sequence: PrologOperationResultDto[];
    status: string;
}

export interface GeneticScheduleResultDto {
    algorithm: 'genetic';
    schedule: DailyScheduleResultDto;
    prolog: PrologFullResultDto;

    populationSize: number;
    generations: number;
    mutationRate: number;
    crossoverRate: number;
}

export interface SmartScheduleResultDto {
    selectedAlgorithm: 'optimal' | 'greedy' | 'local_search' | 'genetic';

    schedule: DailyScheduleResultDto;
    prolog: PrologFullResultDto;

    problemSize: number;
    vesselCount: number;
    craneCount: number;

    selectionReason: string;
}
export interface SaveScheduleDto {
    planDate: string;
    author: string;
    algorithm: string;
    total_delay: number;
    status: string;
    operations: SchedulingOperationDto[];
}