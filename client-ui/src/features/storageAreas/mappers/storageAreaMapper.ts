import type {
    StorageAreaDto,
    StorageAreaGridDto,
    ContainerDto,
    CreatingStorageAreaDto,
    StorageAreaDockDistanceDto,
} from "../dto/storageAreaDtos";

import type {
    StorageArea,
    StorageAreaGrid,
    Container,
    CreatingStorageArea,
    StorageAreaDockDistance,
} from "../domain/storageArea";

// helpers identitários mas isolam a fronteira API

export function mapStorageAreaDockDistanceDto(
    dto: StorageAreaDockDistanceDto
): StorageAreaDockDistance {
    return { ...dto };
}

export function mapStorageAreaDto(dto: StorageAreaDto): StorageArea {
    return {
        ...dto,
        distancesToDocks: dto.distancesToDocks.map(mapStorageAreaDockDistanceDto),
    };
}

export function mapStorageAreasDto(dtos: StorageAreaDto[]): StorageArea[] {
    return dtos.map(mapStorageAreaDto);
}

export function mapStorageAreaGridDto(dto: StorageAreaGridDto): StorageAreaGrid {
    return {
        maxBays: dto.maxBays,
        maxRows: dto.maxRows,
        maxTiers: dto.maxTiers,
        slots: dto.slots.map(s => ({ ...s })),
    };
}

export function mapContainerDto(dto: ContainerDto): Container {
    return { ...dto };
}

export function toCreatingStorageAreaDto(
    domain: CreatingStorageArea
): CreatingStorageAreaDto {
    return {
        ...domain,
        // se no futuro o backend precisar de outros campos, mudas aqui
    };
}
