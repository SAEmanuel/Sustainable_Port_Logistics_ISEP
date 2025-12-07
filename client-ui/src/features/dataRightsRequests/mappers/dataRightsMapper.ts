import type { DataRightsRequestDto } from "../dto/dataRightsDtos";
import type { DataRightsRequest } from "../domain/dataRights";

export function mapRequestDto(dto: DataRightsRequestDto): DataRightsRequest {
    return {
        ...dto,
    };
}

export function mapRequestsDto(
    dtos: DataRightsRequestDto[],
): DataRightsRequest[] {
    return dtos.map(mapRequestDto);
}
