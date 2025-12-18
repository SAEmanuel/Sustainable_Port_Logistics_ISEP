import type { ComplementaryTask } from "../domain/complementaryTask";
import type { ComplementaryTaskDTO } from "../dtos/complementaryTaskDTO";

export function mapToCTDomain(dto: ComplementaryTaskDTO): ComplementaryTask {
    return {
        id : dto.id,
        code : dto.code,
        category : dto.category,
        staff : dto.staff,
        timeStart : dto.timeStart,
        timeEnd : dto.timeEnd,
        status : dto.status,
        vve : dto.vve
    };
}