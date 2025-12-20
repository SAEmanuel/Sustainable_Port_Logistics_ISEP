import type {VesselVisitExecutionDTO} from "../dto/vesselVisitExecutionDTO.ts";
import type {VesselVisitExecution} from "../domain/vesselVisitExecution.ts";

export function mapToVVEDomain(dto: VesselVisitExecutionDTO): VesselVisitExecution {
    return {
        id : dto.id,
        code : dto.code,
        vvnId : dto.vvnId,
        vesselImo : dto.vesselImo,
        actualArrivalTime : dto.actualArrivalTime,
        status : dto.status,
        creatorEmail : dto.creatorEmail,
    };
}


