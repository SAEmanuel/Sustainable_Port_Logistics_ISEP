import type { sarDTO } from "../dto/sarDTOs";
import type { sar } from "../domain/sar";

export function mapSARDto(dto: sarDTO): sar {
    return {
        id : dto.id,
        name :dto.name,
        citizenId : dto.citizenId,
        nationality : dto.nationality,
        email  : dto.email,
        phoneNumber  : dto.phoneNumber,
        sao  : dto.sao,
        notifs : dto.notifs,
        status  : dto.status
    };
}
