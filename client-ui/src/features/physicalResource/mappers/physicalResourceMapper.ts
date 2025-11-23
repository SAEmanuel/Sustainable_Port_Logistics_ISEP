import type { PhysicalResource } from "../domain/physicalResource";
import type {
    CreatePhysicalResourceRequest,
    UpdatePhysicalResourceRequest
} from "../dtos/physicalResource";
import { PhysicalResourceType, PhysicalResourceStatus } from "../domain/physicalResource";

interface PhysicalResourceRaw {
    id: string | number;
    code: string | { value: string };
    description: string;
    operationalCapacity: string | number;
    setupTime: string | number;
    physicalResourceType: PhysicalResourceType;
    physicalResourceStatus: PhysicalResourceStatus;
    qualificationID?: string | null;
}

export function mapToPhysicalResource(apiResponse: unknown): PhysicalResource {
    const raw = apiResponse as PhysicalResourceRaw;

    return {
        id: String(raw.id),
        code: typeof raw.code === 'string'
            ? { value: raw.code }
            : { value: raw.code?.value || '' },
        description: raw.description,
        operationalCapacity: Number(raw.operationalCapacity),
        setupTime: Number(raw.setupTime),
        physicalResourceType: raw.physicalResourceType,
        physicalResourceStatus: raw.physicalResourceStatus,
        qualificationID: raw.qualificationID || null
    };
}
export function mapToUpdatePhysicalResourceRequest(data: Partial<PhysicalResource>): UpdatePhysicalResourceRequest {
    return {
        description: data.description,
        operationalCapacity: data.operationalCapacity,
        setupTime: data.setupTime,
        qualificationId: data.qualificationID || undefined
    };
}
export function mapToCreatePhysicalResourceRequest(data: any): CreatePhysicalResourceRequest {
    return {
        description: data.description,
        operationalCapacity: data.operationalCapacity,
        setupTime: data.setupTime,
        physicalResourceType: data.physicalResourceType,
        qualificationCode: data.qualificationCode
    };
}