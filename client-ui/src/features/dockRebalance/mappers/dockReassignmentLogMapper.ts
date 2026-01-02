import type { DockReassignmentLogDTO } from "../dto/dockReassignmentLogDTO";
import type { DockReassignmentLog } from "../domain/dockReassignmentLog";



export function mapDockReassignmentLogToDomain(dto: DockReassignmentLogDTO): DockReassignmentLog {
    return {
        id: dto.id,
        vvnId: dto.vvnId,
        vesselName: dto.vesselName,
        originalDock: dto.originalDock,
        updatedDock: dto.updatedDock,
        officerId: dto.officerId,
        timestamp: dto.timestamp
    };
}


export function mapDockReassignmentLogToDTO(domain: DockReassignmentLog): DockReassignmentLogDTO {
    return {
        vvnId: domain.vvnId,
        vesselName: domain.vesselName,
        originalDock: domain.originalDock,
        updatedDock: domain.updatedDock,
        officerId: domain.officerId,
        timestamp: domain.timestamp || new Date().toISOString()
    };
}