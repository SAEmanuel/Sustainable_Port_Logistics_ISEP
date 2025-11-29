import type { SelectedEntityInfo, UserRole } from "../types/selection";
import { Roles } from "../../../app/types";
import type { ReactNode } from "react";

/* ========= tipos e helpers da simulação local ========= */

type SimStatus =
    | "Waiting"
    | "Loading"
    | "Unloading"
    | "Loading & Unloading"
    | "Completed";

type VisitSimSummary = {
    status: SimStatus;
    doneCount: number;
    ongoingCount: number;
    totalTasks: number;
    progress: number; // 0..1 (podes usar no futuro para barras de progresso)
};

function hashStringToInt(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

/** duração pseudo-aleatória mas determinística por task: [30s, 120s) */
function getTaskDurationSeconds(task: any): number {
    const key = String(task.id ?? task.code ?? "");
    const base = hashStringToInt(key);
    const span = 120 - 30; // 90
    return 30 + (base % span);
}

/**
 * Simula linha temporal das tasks:
 *  - tasks executadas em série (com ~5s de intervalo)
 *  - devolve estado atual, nº concluídas, nº em progresso, total, progresso 0..1
 */
function simulateVisitState(visit: any): VisitSimSummary | null {
    if (!visit || !Array.isArray(visit.tasks) || visit.tasks.length === 0) {
        return null;
    }

    const tasks = visit.tasks as any[];
    const totalTasks = tasks.length;

    // relógio de simulação (s) – baseado no tempo real para irmos avançando
    // + pequeno offset por navio, para não estarem todos sincronizados
    const baseKey =
        String(visit.vvnId ?? visit.vvnCode ?? visit.code ?? visit.eta ?? "");
    const offset = hashStringToInt(baseKey) % 20; // até 20s de offset
    const nowSec = performance.now() / 1000 + offset;

    const GAP = 5; // ~5s de intervalo entre operações

    let cursor = 0;
    let doneCount = 0;
    let ongoingCount = 0;
    let lastEnd = 0;
    const activeTypes = new Set<string>();

    for (const t of tasks) {
        const dur = getTaskDurationSeconds(t);
        const start = cursor;
        const end = cursor + dur;

        if (nowSec >= end) {
            // task já terminou
            doneCount++;
        } else if (nowSec >= start && nowSec < end) {
            // task em execução
            ongoingCount++;
            activeTypes.add(String(t.type));
        }

        cursor = end + GAP;
        lastEnd = end;
    }

    const totalSpan = lastEnd || 1;
    const clamped = Math.max(0, Math.min(nowSec, totalSpan));
    const progress = totalSpan > 0 ? clamped / totalSpan : 0;

    let status: SimStatus;

    if (doneCount >= totalTasks && ongoingCount === 0) {
        status = "Completed";
    } else if (ongoingCount === 0) {
        status = "Waiting";
    } else {
        const hasContainer = Array.from(activeTypes).some(
            (t) => t === "ContainerHandling",
        );
        const hasYardOrStorage = Array.from(activeTypes).some(
            (t) => t === "YardTransport" || t === "StoragePlacement",
        );

        if (hasContainer && hasYardOrStorage) status = "Loading & Unloading";
        else if (hasContainer) status = "Unloading";
        else status = "Loading";
    }

    return {
        status,
        doneCount,
        ongoingCount,
        totalTasks,
        progress,
    };
}

function getStatusColor(status?: SimStatus | string): string {
    switch (status) {
        case "Loading":
            return "#22c55e";
        case "Unloading":
            return "#f97316";
        case "Loading & Unloading":
            return "#a855f7";
        case "Completed":
            return "#3b82f6";
        case "Waiting":
        default:
            return "#9ca3af";
    }
}

function getStatusTooltip(status?: SimStatus | string): string {
    switch (status) {
        case "Loading":
            return "Vessel currently loading cargo.";
        case "Unloading":
            return "Vessel currently unloading cargo.";
        case "Loading & Unloading":
            return "Vessel loading and unloading cargo simultaneously.";
        case "Completed":
            return "All scheduled operations for this vessel are completed.";
        case "Waiting":
        default:
            return "Vessel at dock, waiting for operations to start.";
    }
}

/* ======================= OVERLAY ======================= */

type Props = {
    visible: boolean;
    selected: SelectedEntityInfo | null;
    roles: UserRole[];
};

export function InfoOverlay({ visible, selected, roles }: Props) {
    if (!visible || !selected || selected.kind === "unknown") return null;

    const privileged =
        roles.includes(Roles.PortAuthorityOfficer) ||
        roles.includes(Roles.LogisticsOperator);

    let title = "";
    const general: ReactNode[] = [];
    const restricted: ReactNode[] = [];

    switch (selected.kind) {
        case "dock": {
            const d = selected.dto;
            title = `Dock ${d.code}`;
            general.push(
                <p key="loc">
                    <strong>Location:</strong> {d.location ?? "—"}
                </p>,
                <p key="len">
                    <strong>Length:</strong> {d.lengthM.toFixed(1)} m
                </p>,
                <p key="depth">
                    <strong>Depth:</strong> {d.depthM.toFixed(1)} m
                </p>,
            );
            if (privileged) {
                restricted.push(
                    <p key="status">
                        <strong>Status:</strong> {d.status ?? "Unknown"}
                    </p>,
                    <p key="allowed">
                        <strong>Allowed vessel types:</strong>{" "}
                        {d.allowedVesselTypeIds?.length ?? 0}
                    </p>,
                );
            }
            break;
        }

        case "storageArea": {
            const s = selected.dto;
            title = s.name;
            general.push(
                <p key="type">
                    <strong>Type:</strong> {s.type}
                </p>,
                <p key="cap">
                    <strong>Capacity:</strong>{" "}
                    {s.currentCapacityTeu}/{s.maxCapacityTeu} TEU
                </p>,
            );
            if (s.description) {
                general.push(
                    <p key="desc">
                        <strong>Description:</strong> {s.description}
                    </p>,
                );
            }
            if (privileged) {
                restricted.push(
                    <p key="phys">
                        <strong>Physical resources:</strong>{" "}
                        {s.physicalResources?.length ?? 0}
                    </p>,
                );
            }
            break;
        }

        case "vessel": {
            const v = selected.dto;
            title = v.name;

            // dados gerais – sempre visíveis
            general.push(
                <p key="imo">
                    <strong>IMO:</strong> {v.imoNumber}
                </p>,
                <p key="owner">
                    <strong>Owner:</strong> {v.owner}
                </p>,
            );

            const visit = (v as any).visit;

            // só PortAuthority / Logistics vê detalhes operacionais
            if (privileged) {
                if (v.lengthMeters || v.widthMeters) {
                    restricted.push(
                        <p key="dims">
                            <strong>Dimensions:</strong>{" "}
                            {v.lengthMeters ?? "?"} m ×{" "}
                            {v.widthMeters ?? "?"} m
                        </p>,
                    );
                }

                if (visit) {
                    if (visit.eta || visit.eta) {
                        restricted.push(
                            <p key="eta">
                                <strong>ETA:</strong>{" "}
                                {visit.eta
                                    ? new Date(
                                        visit.eta,
                                    ).toLocaleString()
                                    : "—"}
                            </p>,
                            <p key="etd">
                                <strong>ETD:</strong>{" "}
                                {visit.etd
                                    ? new Date(
                                        visit.etd,
                                    ).toLocaleString()
                                    : "—"}
                            </p>,
                        );
                    }

                    if (visit.dockCode) {
                        restricted.push(
                            <p key="dock">
                                <strong>Dock:</strong> {visit.dockCode}
                            </p>,
                        );
                    }

                    // simulação local de estado/tarefas
                    const sim = simulateVisitState(visit);

                    if (sim) {
                        const dotColor = getStatusColor(sim.status);
                        const tooltip = getStatusTooltip(sim.status);

                        restricted.unshift(
                            <p key="op-status">
                                <strong>Operational status:</strong>{" "}
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: 8,
                                        height: 8,
                                        borderRadius: "999px",
                                        background: dotColor,
                                        marginRight: 4,
                                    }}
                                    title={tooltip}
                                />{" "}
                                {sim.status}
                            </p>,
                        );

                        restricted.push(
                            <p key="tasks">
                                <strong>Tasks completed:</strong>{" "}
                                {sim.doneCount} / {sim.totalTasks}
                            </p>,
                        );
                    }
                }
            }
            break;
        }

        case "container": {
            const c = selected.dto;
            title = `Container ${c.isoCode}`;
            general.push(
                <p key="type">
                    <strong>Type:</strong> {c.type ?? "—"}
                </p>,
                <p key="status">
                    <strong>Status:</strong> {c.status ?? "—"}
                </p>,
            );
            if (privileged && c.weightKg != null) {
                restricted.push(
                    <p key="w">
                        <strong>Weight:</strong> {c.weightKg} kg
                    </p>,
                );
            }
            break;
        }

        case "resource": {
            const r = selected.dto;
            title = r.code;
            general.push(
                <p key="desc">
                    <strong>Description:</strong> {r.description}
                </p>,
            );
            if (privileged) {
                restricted.push(
                    <p key="cap">
                        <strong>Capacity:</strong> {r.operationalCapacity}
                    </p>,
                    <p key="status">
                        <strong>Status:</strong> {r.physicalResourceStatus}
                    </p>,
                );
            }
            break;
        }

        case "decorativeCrane":
            title = "Decorative Crane";
            general.push(
                <p key="dock">
                    <strong>Dock:</strong> {selected.dto.dockId ?? "—"}
                </p>,
            );
            break;

        case "decorativeStorage":
            title = "Decorative Building";
            general.push(
                <p key="zone">
                    <strong>Zone:</strong> {selected.dto.zone ?? "—"}
                </p>,
            );
            break;
    }

    return (
        <div
            style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                pointerEvents: "none", // não bloqueia a câmara
                zIndex: 20,
            }}
        >
            <div
                style={{
                    pointerEvents: "auto",
                    maxWidth: 320,
                    background: "rgba(10,10,20,0.9)",
                    color: "#f9fafb",
                    padding: "0.75rem 0.9rem",
                    borderRadius: 10,
                    fontSize: 13,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
                    border: "1px solid rgba(148,163,184,0.5)",
                }}
            >
                <div style={{ marginBottom: 6 }}>
                    <strong>{title}</strong>
                </div>
                <div>{general}</div>
                {privileged && restricted.length > 0 && (
                    <div
                        style={{
                            marginTop: 8,
                            paddingTop: 6,
                            borderTop:
                                "1px solid rgba(148,163,184,0.35)",
                            opacity: 0.9,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                textTransform: "uppercase",
                                marginBottom: 4,
                            }}
                        >
                            Operational details
                        </div>
                        {restricted}
                    </div>
                )}
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 11,
                        opacity: 0.7,
                    }}
                >
                    Press <kbd>i</kbd> to toggle this panel.
                </div>
            </div>
        </div>
    );
}
