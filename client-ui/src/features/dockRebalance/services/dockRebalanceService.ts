import type { DockRebalanceFinalDto } from "../dto/dockRebalanceDTO";
import {operationsApi, planningApi} from "../../../services/api";
import type {DockReassignmentLogDTO} from "../dto/dockReassignmentLogDTO.ts";
import type {DockReassignmentLog} from "../domain/dockReassignmentLog.ts";
import {mapDockReassignmentLogToDomain} from "../mappers/dockReassignmentLogMapper.ts";


export async function getDockRebalanceProposal(day: string): Promise<DockRebalanceFinalDto> {
    const res = await planningApi.get("/api/rebalance/docks/plan", {
        params: { day }
    });

    return res.data;
}

export async function createDockReassignmentLog(dto: DockReassignmentLogDTO): Promise<DockReassignmentLog> {
    const res = await operationsApi.post("/api/dock-reassignment-log", dto);
    return mapDockReassignmentLogToDomain(res.data);
}

export async function getAllDockReassignmentLog(): Promise<DockReassignmentLog[]> {
    const res = await operationsApi.get("/api/dock-reassignment-log");
    return res.data.map(mapDockReassignmentLogToDomain);
}