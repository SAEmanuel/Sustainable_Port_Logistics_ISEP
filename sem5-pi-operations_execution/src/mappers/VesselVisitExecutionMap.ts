import { Mapper } from "../core/infra/Mapper";
import { VesselVisitExecution } from "../domain/vesselVisitExecution/vesselVisitExecution";
import { VesselVisitExecutionCode } from "../domain/vesselVisitExecution/vesselVisitExecutionCode";
import { IVesselVisitExecutionDTO } from "../dto/IVesselVisitExecutionDTO";
import { IVesselVisitExecutionPersistence } from "../dataschema/IVesselVisitExecutionPersistence";
import { UniqueEntityID } from "../core/domain/UniqueEntityID";

export default class VesselVisitExecutionMap extends Mapper<VesselVisitExecution, IVesselVisitExecutionDTO, IVesselVisitExecutionPersistence> {

    toDTO(vve: VesselVisitExecution): IVesselVisitExecutionDTO {
        return {
            id: vve.id.toString(),
            code: vve.code.value,
            vvnId: vve.vvnId,
            vesselImo: vve.vesselImo,
            actualArrivalTime: vve.actualArrivalTime,

            actualBerthTime: vve.actualBerthTime,
            actualDockId: vve.actualDockId,
            dockDiscrepancyNote: vve.dockDiscrepancyNote,
            updatedAt: vve.updatedAt,
            auditLog: vve.auditLog,

            status: vve.status,
            creatorEmail: vve.creatorEmail
        } as IVesselVisitExecutionDTO;
    }


    toDomain(vve: any | IVesselVisitExecutionPersistence): VesselVisitExecution {
        const vveOrError = VesselVisitExecution.create(
            {
                code: VesselVisitExecutionCode.create(vve.code),
                vvnId: vve.vvnId,
                vesselImo: vve.vesselImo,
                actualArrivalTime: new Date(vve.actualArrivalTime),
                creatorEmail: vve.creatorEmail,
                status: vve.status,

                actualBerthTime: vve.actualBerthTime ? new Date(vve.actualBerthTime) : undefined,
                actualDockId: vve.actualDockId,
                dockDiscrepancyNote: vve.dockDiscrepancyNote,
                updatedAt: vve.updatedAt ? new Date(vve.updatedAt) : undefined,
                auditLog: vve.auditLog ?? []
            },
            new UniqueEntityID(vve.domainId)
        );
        
        return vveOrError;
    }

    toPersistence(vve: VesselVisitExecution): IVesselVisitExecutionPersistence {
        return {
            domainId: vve.id.toString(),
            code: vve.code.value,
            vvnId: vve.vvnId,
            vesselImo: vve.vesselImo,
            actualArrivalTime: vve.actualArrivalTime,

            actualBerthTime: vve.actualBerthTime,
            actualDockId: vve.actualDockId,
            dockDiscrepancyNote: vve.dockDiscrepancyNote,
            updatedAt: vve.updatedAt,
            auditLog: vve.auditLog,

            creatorEmail: vve.props.creatorEmail,
            status: vve.status,
        };
    }

}