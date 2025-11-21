import type {
    CreateDockRequestDto,
    UpdateDockRequestDto,
} from "../dto/dockDtos";

export type CreateDockRequest = CreateDockRequestDto;
export type UpdateDockRequest = UpdateDockRequestDto;

export interface Dock {
    id: string;
    code: string | { value: string };
    location: string;
    status?: string | number;
    allowedVesselTypeIds: Array<string | { value: string }>;
    physicalResourceCodes: Array<string | { value: string }>;
    lengthM: number;
    depthM: number;
    maxDraftM: number;
}
