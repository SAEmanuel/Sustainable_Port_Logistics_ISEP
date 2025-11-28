import type { SelectedEntityInfo, UserRole } from "../types/selection";
import { Roles } from "../../../app/types";
import type { ReactNode } from "react";

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

            // se tivermos info de visita (VVN accepted), podemos mostrar ETA/ETD
            const visit = v.visit;

            if (visit && privileged) {
                restricted.push(
                    <p key="dims">
                        <strong>Dimensions:</strong>{" "}
                        {v.lengthMeters ?? "?"} m × {v.widthMeters ?? "?"} m
                    </p>,
                    <p key="eta">
                        <strong>ETA:</strong>{" "}
                        {new Date(visit.eta).toLocaleString()}
                    </p>,
                    <p key="etd">
                        <strong>ETD:</strong>{" "}
                        {new Date(visit.etd).toLocaleString()}
                    </p>,
                    visit.dockCode && (
                        <p key="dock">
                            <strong>Dock:</strong> {visit.dockCode}
                        </p>
                    ),
                    <p key="tasks">
                        <strong>Ongoing tasks:</strong>{" "}
                        {visit.tasks.filter(t => t.status === "InProgress").length} /
                        {visit.tasks.length}
                    </p>,
                );
            } else if (privileged) {
                // se não houver visit, pelo menos mostramos as dimensões
                restricted.push(
                    <p key="dims">
                        <strong>Dimensions:</strong>{" "}
                        {v.lengthMeters ?? "?"} m × {v.widthMeters ?? "?"} m
                    </p>,
                );
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
                            borderTop: "1px solid rgba(148,163,184,0.35)",
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
