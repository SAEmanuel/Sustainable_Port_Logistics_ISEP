import { PhysicalResourceType } from "../domain/physicalResource";

export interface CreatePhysicalResourceRequest {
    description: string;
    operationalCapacity?: number;
    setupTime?: number;
    physicalResourceType?: PhysicalResourceType;
    qualificationCode?: string;
}

export interface UpdatePhysicalResourceRequest {
    description?: string;
    operationalCapacity?: number;
    setupTime?: number;
    qualificationId?: string;
}

export interface PhysicalResourceListResponse {
    physicalResourcesCodes: string[];
}