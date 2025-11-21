// src/docks/dto/dockDtos.ts

export type DockDto = {
    id: string;
    code: string | { value: string };
    physicalResourceCodes: Array<string | { value: string }>;
    location: string;
    lengthM: number;
    depthM: number;
    maxDraftM: number;
    status: string | number;
    allowedVesselTypeIds: Array<string | { value: string }>;
};

export type CreateDockRequestDto = {
    code: string;
    physicalResourceCodes: string[];
    location: string;
    lengthM: number;
    depthM: number;
    maxDraftM: number;
    allowedVesselTypeNames: string[];
    status: string | number;
};

export type UpdateDockRequestDto = {
    code?: string;
    physicalResourceCodes?: string[];
    location?: string;
    lengthM?: number;
    depthM?: number;
    maxDraftM?: number;
    allowedVesselTypeIds?: string[];
    status?: string | number;
};
