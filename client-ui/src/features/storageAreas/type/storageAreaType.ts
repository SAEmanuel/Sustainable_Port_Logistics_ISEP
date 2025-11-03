export interface StorageAreaDockDistance {
    dockCode: string;
    distance: number;
}

export type StorageAreaType = "Yard" | "Warehouse";

export interface CreatingStorageArea {
    name: string;
    description?: string | null;
    type: StorageAreaType;
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    physicalResources: string[];
    distancesToDocks: StorageAreaDockDistance[];
}

export interface StorageAreaDto {
    id: string;
    name: string;
    description?: string | null;
    type: StorageAreaType;
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    maxCapacityTeu: number;
    currentCapacityTeu: number;
    physicalResources: string[];
    distancesToDocks: StorageAreaDockDistance[];
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
    slots: StorageSlotDto[]; // só ocupados têm iso
}
