import type { DockRebalanceFinal, RebalanceResultEntry } from "../domain/dockRebalance";
import type { DockRebalanceFinalDto } from "../dto/dockRebalanceDTO";

export function mapToDockRebalanceDomain(dto: DockRebalanceFinalDto): DockRebalanceFinal {
    const results: RebalanceResultEntry[] = dto.candidates.map(candidate => {
        const assignment = dto.assignments.find(a => a.id === candidate.vvnId);
        const proposedDock = assignment ? assignment.dock : candidate.currentDock;

        return {
            vvnId: candidate.vvnId,
            vesselName: candidate.vesselName,
            originalDock: candidate.currentDock,
            proposedDock: proposedDock,
            eta: candidate.estimatedTimeArrival,
            etd: candidate.estimatedTimeDeparture,
            duration: candidate.operationDurationHours,
            isMoved: candidate.currentDock !== proposedDock
        };
    });

    return {
        day: dto.day,
        loadDifferences: dto.loadDifferences.map(ld => ({
            dock: ld.dock,
            before: ld.before,
            after: ld.after,
            difference: ld.difference
        })),
        results,
        stats: {
            balanceScore: dto.balanceScore,
            improvementPercent: dto.improvementPercent,
            stdDevBefore: dto.stdDevBefore,
            stdDevAfter: dto.stdDevAfter
        }
    };
}