import { IOperationDTO } from "../dto/IOperationPlanDTO";
import { IPlanInconsistencyDTO } from "../dto/IUpdateOperationPlanDTO";

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return aStart < bEnd && bStart < aEnd;
}

function getStaffIds(op: IOperationDTO): string[] {
    const arr = op.staffAssignments ?? [];
    return arr
        .map((x: any) => x?.staffId ?? x?.id ?? (typeof x === "string" ? x : null))
        .filter((x: any) => typeof x === "string" && x.length > 0);
}

export function checkPlanInconsistencies(allOps: IOperationDTO[], editedVvnId: string): IPlanInconsistencyDTO[] {
    const warnings: IPlanInconsistencyDTO[] = [];

    const editedOps = allOps.filter(o => o.vvnId === editedVvnId);
    const otherOps = allOps.filter(o => o.vvnId !== editedVvnId);

    for (const e of editedOps) {
        for (const o of otherOps) {
            if (!overlaps(e.startTime, e.endTime, o.startTime, o.endTime)) continue;

            // 1) Mesmo dock: verificar capacidade de cranes (blocking)
            if (e.dock && o.dock && e.dock === o.dock) {
                const capacity = Math.max(e.totalCranesOnDock || 0, o.totalCranesOnDock || 0);
                const used = (e.craneCountUsed || 0) + (o.craneCountUsed || 0);
                if (capacity > 0 && used > capacity) {
                    warnings.push({
                        severity: "blocking",
                        code: "CRANE_CAPACITY_EXCEEDED",
                        message: `Conflito de capacidade de gruas no dock ${e.dock} (used=${used} > capacity=${capacity}) em overlap temporal.`,
                        relatedVvnIds: [editedVvnId, o.vvnId]
                    });
                }
            }

            // 2) Mesma grua (string) em overlap (blocking ou warning, conforme política)
            if (e.crane && o.crane && e.crane === o.crane) {
                warnings.push({
                    severity: "blocking",
                    code: "CRANE_OVERLAP",
                    message: `A grua ${e.crane} está atribuída a duas operações em simultâneo.`,
                    relatedVvnIds: [editedVvnId, o.vvnId]
                });
            }

            // 3) Staff overlap (warning por defeito)
            const eStaff = new Set(getStaffIds(e));
            const oStaff = getStaffIds(o);
            const common = oStaff.filter(id => eStaff.has(id));
            if (common.length > 0) {
                warnings.push({
                    severity: "warning",
                    code: "STAFF_OVERLAP",
                    message: `Possível conflito de staff (ids: ${common.join(", ")}) em overlap temporal.`,
                    relatedVvnIds: [editedVvnId, o.vvnId]
                });
            }
        }
    }

    // Deduplicação simples
    const key = (w: IPlanInconsistencyDTO) => `${w.severity}|${w.code}|${w.message}|${(w.relatedVvnIds ?? []).join(",")}`;
    return Array.from(new Map(warnings.map(w => [key(w), w])).values());
}
