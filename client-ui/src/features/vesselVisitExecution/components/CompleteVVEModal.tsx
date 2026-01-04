import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VesselVisitExecutionService } from "../services/vesselVisitExecutionService";
import { getLatestPlanWithVvnOps } from "../services/operationPlanService";
import { operationsApi } from "../../../services/api";
import type { VesselVisitExecutionDTO } from "../dto/vesselVisitExecutionDTO";
import type { IOperationDTO, IOperationPlanDTO } from "../services/operationPlanService";

// --- Props ---
interface Props {
    isOpen: boolean;
    onClose: () => void;
    vve: VesselVisitExecutionDTO;
    updaterEmail: string;
    onCompleted: (updatedVve: VesselVisitExecutionDTO) => void;
}

// --- Executed operation type from backend ---
type ExecutedOperationFromBackend = {
    plannedOperationId: string;
    actualStart?: string;
    actualEnd?: string;
    status?: "started" | "completed" | "delayed";
};

// --- Helper for status badge ---
const statusBadge = (status?: string) => {
    if (!status) return <span style={{ color: "gray", fontWeight: 600 }}>N/A</span>;
    const color =
        status === "completed" ? "green" : status === "delayed" ? "orange" : "teal";
    return <span style={{ color, fontWeight: 600 }}>{status.toUpperCase()}</span>;
};

const CompleteVVEModal: React.FC<Props> = ({ isOpen, onClose, vve, onCompleted,updaterEmail }) => {
    const { t } = useTranslation();

    const [actualUnBerthTime, setActualUnBerthTime] = useState("");
    const [actualLeavePortTime, setActualLeavePortTime] = useState("");
    const [loading, setLoading] = useState(false);

    const [showUnberthRequired, setShowUnberthRequired] = useState(false);
    const [showLeaveRequired, setShowLeaveRequired] = useState(false);

    const [plan, setPlan] = useState<IOperationPlanDTO | null>(null);
    const [operations, setOperations] = useState<IOperationDTO[]>([]);
    const [operationStatuses, setOperationStatuses] = useState<
        Record<string, ExecutedOperationFromBackend>
    >({});

    // --- Helper: get plannedOperationId for a plan operation
    const plannedOperationIdOf = (op: IOperationDTO, idx: number) => {
        return `${vve.vvnId}-${idx}`;
    };

    // --- Load operations + executed statuses ---
    const loadOperations = async () => {
        if (!vve.vvnId) return;

        try {
            setLoading(true);

            // Fetch latest plan with operations
            const p = await getLatestPlanWithVvnOps(vve.vvnId, 120);
            setPlan(p ?? null);

            const ops: IOperationDTO[] = (p?.operations ?? [])
                .filter((o) => o.vvnId === vve.vvnId)
                .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
            setOperations(ops);

            // Fetch executed operations
            const res = await operationsApi.get(`/api/vve/${vve.id}`);
            const vveData = Array.isArray(res.data) ? res.data[0] : res.data;
            const existingOps: ExecutedOperationFromBackend[] =
                vveData?.executedOperations ?? [];

            const byPlannedId: Record<string, ExecutedOperationFromBackend> = {};
            existingOps.forEach((eo) => {
                if (eo.plannedOperationId)
                    byPlannedId[String(eo.plannedOperationId)] = eo;
            });
            setOperationStatuses(byPlannedId);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadOperations();
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Handle VVE completion ---
    const handleComplete = async () => {
        const unberthEmpty = !actualUnBerthTime;
        const leaveEmpty = !actualLeavePortTime;

        setShowUnberthRequired(unberthEmpty);
        setShowLeaveRequired(leaveEmpty);

        if (unberthEmpty || leaveEmpty) return;

        // Ensure all operations are completed
        const incompleteOps = operations.filter((op, idx) => {
            const plannedId = plannedOperationIdOf(op, idx);
            const status = operationStatuses[plannedId]?.status;
            return status !== "completed";
        });

        if (incompleteOps.length > 0) {
            alert(
                t("errors.notAllOperationsCompleted") ||
                `Cannot complete VVE: ${incompleteOps.length} operation(s) are not completed.`
            );
            return;
        }

        try {
            setLoading(true);

            const updated = await VesselVisitExecutionService.complete({
                actualUnBerthTime: new Date(actualUnBerthTime).toISOString(),
                actualLeavePortTime: new Date(actualLeavePortTime).toISOString(),
                updaterEmail,
            },vve.code);

            onCompleted(updated);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // --- Disable complete button if operations not all completed ---
    const allCompleted = operations.every((op, idx) => {
        const plannedId = plannedOperationIdOf(op, idx);
        return operationStatuses[plannedId]?.status === "completed";
    });

    const hasOperations = operations.length > 0;

    const isAlreadyCompleted =
    vve.status?.toLowerCase() === "completed";

    const canComplete =
    !loading &&
    !isAlreadyCompleted &&
    hasOperations &&
    allCompleted;

    return (
        <div className="vve-details-overlay">
            <div className="vve-details-content">
                {/* Header */}
                <div className="vve-details-header">
                    <h2>{t("vve.complete.title") || "Complete Vessel Visit"}</h2>
                    <button className="vve-close-x" onClick={onClose}>&times;</button>
                </div>

                <div className="vve-grid">
                    {/* Actual Unberth Time */}
                    <div className="vve-item full-width">
                        <label>{t("vve.form.actualUnberthTime") || "Actual Unberth Time"}</label>
                        {showUnberthRequired && (
                            <div style={{ color: "red", fontSize: "0.8rem" }}>This field is required</div>
                        )}
                        <input
                            type="datetime-local"
                            value={actualUnBerthTime}
                            onChange={(e) => setActualUnBerthTime(e.target.value)}
                        />
                    </div>

                    {/* Actual Leave Port Time */}
                    <div className="vve-item full-width">
                        <label>{t("vve.form.actualLeavePortTime") || "Actual Port Departure Time"}</label>
                        {showLeaveRequired && (
                            <div style={{ color: "red", fontSize: "0.8rem" }}>This field is required</div>
                        )}
                        <input
                            type="datetime-local"
                            value={actualLeavePortTime}
                            onChange={(e) => setActualLeavePortTime(e.target.value)}
                        />
                    </div>

                    {/* Operations + Statuses */}
                    {operations.length > 0 && (
                        <div className="vve-item full-width">
                            <h3>{t("vve.operations") || "Operations"}</h3>
                            <ul>
                                {operations.map((op, idx) => {
                                    const plannedId = plannedOperationIdOf(op, idx);
                                    const status = operationStatuses[plannedId]?.status;
                                    return (
                                        <li key={plannedId}>
                                            #{idx + 1} - {op.vessel ?? "Operation"}: {statusBadge(status)}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="vve-footer">
                    <button
                        onClick={onClose}
                        className="vve-close-button"
                        disabled={loading}
                    >
                        {t("vve.complete.actions.cancel") || "Cancel"}
                    </button>

                    <button
                        onClick={handleComplete}
                        className="vve-complete-button"
                        disabled={!canComplete}
                        title={
                            !hasOperations
                            ? t("vve.complete.NoOps")
                            : !allCompleted
                            ? t("vve.complete.OpsLeft")
                            : undefined
                        }
                        >
                        {t("vve.complete.actions.complete") || "Complete VVE"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompleteVVEModal;
