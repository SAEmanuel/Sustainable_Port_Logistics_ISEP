import type { DockDto } from "../dto/dockDtos";
import type { Dock } from "../domain/dock";

export function mapDockDto(dto: DockDto): Dock {
    return {
        id: dto.id,
        code: dto.code,
        physicalResourceCodes: dto.physicalResourceCodes,
        location: dto.location,
        lengthM: dto.lengthM,
        depthM: dto.depthM,
        maxDraftM: dto.maxDraftM,
        status: dto.status,
        allowedVesselTypeIds: dto.allowedVesselTypeIds,
    };
}
