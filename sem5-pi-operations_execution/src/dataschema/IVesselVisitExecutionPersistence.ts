export interface IVesselVisitExecutionPersistence {
    domainId: string;
    code: string;
    vvnId: string;
    vesselImo: string;

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

    executedOperations?: Array<{
        plannedOperationId: string;
        actualStart?: Date;
        actualEnd?: Date;
        resourcesUsed?: Array<{
            resourceId: string;
            quantity?: number;
            hours?: number;
        }>;
        status: "started" | "completed" | "delayed";
        note?: string;
        updatedAt: Date;
        updatedBy: string;
    }>;

    creatorEmail: string;
    status: string;
}
