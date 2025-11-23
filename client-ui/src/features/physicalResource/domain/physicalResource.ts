// @ts-ignore
export enum PhysicalResourceType {
    STSCrane = "STSCrane",
    YGCrane = "YGCrane",
    MCrane = "MCrane",
    Truck = "Truck",
    Forklift = "Forklift",
    RStacker = "RStacker",
    SCarrier = "SCarrier",
    TugBoat = "TugBoat",
    Other = "Other"
}

// @ts-ignore
export enum PhysicalResourceStatus {
    Available = "Available",
    Unavailable = "Unavailable",
    UnderMaintenance = "UnderMaintenance",
}

export interface PhysicalResource {
    id: string;
    code: { value: string }
    description: string;
    operationalCapacity: number;
    setupTime: number;
    physicalResourceType: PhysicalResourceType;
    physicalResourceStatus: PhysicalResourceStatus;
    qualificationID: string | null;
}

export interface CreatePhysicalResource {
    description: string;
    operationalCapacity?: number;
    setupTime?: number;
    physicalResourceType?: PhysicalResourceType;
    qualificationCode?: string;
}

export interface UpdatePhysicalResource {
    description?: string;
    operationalCapacity?: number;
    setupTime?: number;
    qualificationId?: string;
}

export interface PhysicalResourceList {
    physicalResourcesCodes: string[]
}

