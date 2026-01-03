import type { DockRebalanceFinalDto } from "../dto/dockRebalanceDTO";
import { operationsApi, planningApi } from "../../../services/api";

import type { DockReassignmentLogDTO } from "../dto/dockReassignmentLogDTO";
import type { DockReassignmentLog } from "../domain/dockReassignmentLog";

import { useAppStore } from "../../../app/store";
import { mapDockReassignmentLogToDomain } from "../mappers/dockReassignmentLogMapper";

function authHeaders() {
    const user = useAppStore.getState().user;

    return {
        headers: {
            "x-user-email": user?.email ?? "Unknown"
        }
    };
}

export async function getDockRebalanceProposal(
    day: string
): Promise<DockRebalanceFinalDto> {

    const res = await planningApi.get(
        "/api/rebalance/docks/plan",
        { params: { day } }
    );

    return res.data;
}


export async function createDockReassignmentLog(
    dto: DockReassignmentLogDTO
): Promise<DockReassignmentLog> {

    const res = await operationsApi.post(
        "/api/dock-reassignment-log",
        dto,
        authHeaders()
    );

    return mapDockReassignmentLogToDomain(res.data);
}


export async function getAllDockReassignmentLog(): Promise<DockReassignmentLog[]> {

    const res = await operationsApi.get(
        "/api/dock-reassignment-log",
        authHeaders()
    );

    return res.data.map(mapDockReassignmentLogToDomain);
}