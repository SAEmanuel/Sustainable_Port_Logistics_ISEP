export interface IVesselVisitExecutionDTO {
    id?: string;
    code?: string;
    vvnId: string;
    vesselImo?: string;
    actualArrivalTime: Date;

    actualBerthTime?: Date;
    actualDockId?: string;
    dockDiscrepancyNote?: string;

    updatedAt?: Date;
    auditLog?: Array<{
        at: Date;
        by: string;
        action: string;
        changes?: any;
        note?: string;
    }>;

    status?: string;
    creatorEmail: string;
}