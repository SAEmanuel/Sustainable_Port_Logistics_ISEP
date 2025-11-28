// src/features/viewer3d/types.ts
export type UUID = string;

export interface ContainerDto {
    id: UUID;
    isoCode: string;        // unwrap de Iso6346Code
    description?: string | null;
    type?: "General" | "Reefer" | "Electronic" | "Hazmat" | "Oversized";
    status?: "Empty" | "Full" | "Reserved" | "Damaged" | "InTransit";
    weightKg?: number;
    // opcional (se vieres a enviar): positionX/Y/Z
    positionX?: number; positionY?: number; positionZ?: number;
}

export interface DockDto {
    id: UUID;
    code: string;           // unwrap de DockCode
    physicalResourceCodes?: string[]; // unwrap
    location?: string;
    lengthM: number;
    depthM: number;
    maxDraftM: number;
    status?: "Available" | "Unavailable" | "Maintenance";
    allowedVesselTypeIds?: string[]; // unwrap de VesselTypeId
    // opcional futuro: positionX/Y/Z
    positionX?: number; positionY?: number; positionZ?: number;
}

export interface PhysicalResourceDTO {
    id: UUID;
    code: string;           // unwrap PhysicalResourceCode
    description: string;
    operationalCapacity: number;
    setupTime: number;
    physicalResourceType: string;
    physicalResourceStatus: string;
    qualificationID?: UUID | null;
    // opcional
    positionX?: number; positionY?: number; positionZ?: number;
}

export interface StorageAreaDto {
    id: UUID;
    name: string;
    description?: string | null;
    type: "Yard" | "Warehouse";
    maxBays: number;
    maxRows: number;
    maxTiers: number;
    maxCapacityTeu: number;
    currentCapacityTeu: number;
    physicalResources?: (string | null)[];
    distancesToDocks?: any[];

    // derivados para o 3D (calculados no service)
    widthM?: number;   // ≈ bays * TEU_LENGTH
    depthM?: number;   // ≈ rows * TEU_WIDTH
    heightM?: number;  // ≈ tiers * TEU_HEIGHT
    positionX?: number; positionY?: number; positionZ?: number;
}

export interface VesselDto {
    id: UUID;
    imoNumber: string;      // unwrap ImoNumber
    name: string;
    owner: string;
    vesselTypeId: string;   // unwrap VesselTypeId

    lengthMeters?: number;
    widthMeters?: number;
    draftMeters?: number;
    positionX?: number; positionY?: number; positionZ?: number;

    /** Info da visita (VVN Accepted) associada a este navio, se existir */
    visit?: {
        vvnId: string;
        vvnCode: string;

        eta: string;   // EstimatedTimeArrival
        etd: string;   // EstimatedTimeDeparture
        actualArrival?: string | null;
        actualDeparture?: string | null;
        acceptanceDate?: string | null;

        volume: number;
        status: string;        // “Accepted” etc.
        dockCode?: string | null;

        tasks: {
            id: string;
            code: string;
            type: string;      // TaskType
            status: string;    // TaskStatus
            startTime?: string | null;
            endTime?: string | null;
        }[];
    };
}


export interface SceneData {
    docks: DockDto[];
    storageAreas: StorageAreaDto[];
    vessels: VesselDto[];
    containers: ContainerDto[];
    resources: PhysicalResourceDTO[];
}
