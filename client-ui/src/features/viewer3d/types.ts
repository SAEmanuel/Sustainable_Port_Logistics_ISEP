// src/features/viewer3d/types.ts
export type UUID = string;

export interface DockDto {
    id: UUID;
    code: string;
    vesselTypeId?: string | null;
    location?: string | null;
    status?: string | null;
    // Nota: sem geometria no DTO, vamos gerar retângulos simples
}

export interface StorageAreaDto {
    id: UUID;
    name: string;
    description?: string | null;
    width: number;   // metros
    depth: number;   // metros
    height: number;  // metros
    // posição aproximada para MVP (se não existir no backend)
    positionX?: number;
    positionY?: number;
    positionZ?: number;
}

export interface VesselDto {
    id: UUID;
    imoNumber: string;
    name: string;
    owner: string;
    vesselTypeName?: string | null;
    // tamanho aproximado (se o backend não expõe)
    lengthMeters?: number;
    widthMeters?: number;
    draftMeters?: number;
    positionX?: number;
    positionY?: number;
    positionZ?: number;
}

export interface ContainerDto {
    id: UUID;
    isoCode: string;
    type?: string | null;
    status?: string | null;
    // posição opcional (para MVP)
    positionX?: number;
    positionY?: number;
    positionZ?: number;
}

export interface PhysicalResourceDTO {
    id: UUID;
    code: string;
    description?: string | null;
    operationalCapacity?: number | null;
    status?: string | null;
    // posição opcional (para MVP)
    positionX?: number;
    positionY?: number;
    positionZ?: number;
}

export interface SceneData {
    docks: DockDto[];
    storageAreas: StorageAreaDto[];
    vessels: VesselDto[];
    containers: ContainerDto[];
    resources: PhysicalResourceDTO[];
}
