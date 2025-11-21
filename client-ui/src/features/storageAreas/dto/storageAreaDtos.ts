
export interface StorageAreaDockDistanceDto {
    dockCode: string;
    distance: number;
}

export type StorageAreaTypeDto = "Yard" | "Warehouse";

export interface CreatingStorageAreaDto {
    name: string;
    description?: string | null;
    type: StorageAreaTypeDto;
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    physicalResources: string[];
    distancesToDocks: StorageAreaDockDistanceDto[];
}

export interface StorageAreaDto {
    id: string;
    name: string;
    description?: string | null;
    type: StorageAreaTypeDto;
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    maxCapacityTeu: number;
    currentCapacityTeu: number;
    physicalResources: string[];
    distancesToDocks: StorageAreaDockDistanceDto[];
}

export interface StorageSlotDto {
    bay: number;
    row: number;
    tier: number;
    iso?: string | null;
}

export interface StorageAreaGridDto {
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    slots: StorageSlotDto[];
}

export type ContainerTypeDto =
    | "General"
    | "Reefer"
    | "Electronic"
    | "Hazmat"
    | "Oversized";

export type ContainerStatusDto =
    | "Empty"
    | "Full"
    | "Reserved"
    | "Damaged"
    | "InTransit";

export interface ContainerDto {
    id: string;
    isoNumber: string;
    description: string;
    containerType: ContainerTypeDto | string;
    containerStatus: ContainerStatusDto | string;
    weight: number;
}
