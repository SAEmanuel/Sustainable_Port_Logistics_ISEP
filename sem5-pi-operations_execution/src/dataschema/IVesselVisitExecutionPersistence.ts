export interface IVesselVisitExecutionPersistence {
    domainId: string;
    code: string;
    vvnId: string;
    vesselImo: string;
    actualArrivalTime: Date;
    creatorEmail: string;
    status: string;
}