// src/features/dataRightsRequests/admin/components/AdminRequestDetailsModal.tsx

import { useTranslation } from "react-i18next";
import type { DataRightsRequest } from "../../domain/dataRights";

type Props = {
    request: DataRightsRequest | null;
    open: boolean;
    onClose: () => void;
    onAssignToMe: () => void;
    onRespond: () => void;
    isBusy: boolean;
};

export function AdminRequestDetailsModal({
                                             request,
                                             open,
                                             onClose,
                                             onAssignToMe,
                                             onRespond,
                                             isBusy,
                                         }: Props) {
    const { t } = useTranslation();

    if (!open || !request) return null;

    const created = new Date(
        (request.createdOn as any).value ?? request.createdOn,
    ).toLocaleString();
    const updated = request.updatedOn
        ? new Date(
            (request.updatedOn as any).value ?? request.updatedOn,
        ).toLocaleString()
        : "-";

    const canAssign = !request.processedBy;
    const canRespond =
        request.status === "InProgress" &&
        !!request.processedBy &&
        (request.type === "Access" ||
            request.type === "Deletion" ||
            request.type === "Rectification");


    // timeline – que passos estão done/active
    const step1Class =
        request.status === "WaitingForAssignment"
            ? "dr-status-active"
            : "dr-status-done";

    const step2Class =
        request.status === "InProgress"
            ? "dr-status-active"
            : request.status === "Completed" ||
            request.status === "Rejected"
                ? "dr-status-done"
                : "";

    const step3Base =
        request.status === "Rejected"
            ? "dr-status-step-reject"
            : "";

    const step3Class =
        request.status === "Completed" || request.status === "Rejected"
            ? `${step3Base} dr-status-active dr-status-done`
            : step3Base;

    // payload pretty-print
    let payloadPretty: string | null = null;
    if (request.payload) {
        try {
            const parsed =
                typeof request.payload === "string"
                    ? JSON.parse(request.payload)
                    : request.payload;
            payloadPretty = JSON.stringify(parsed, null, 2);
        } catch {
            payloadPretty = String(request.payload);
        }
    }

    return (
        <div className="dr-modal-overlay">
            <div className="dr-modal dr-admin-modal">
                <div className="dr-modal-header">
                    <div>
                        <h2 className="dr-card-title">
                            🧾{" "}
                            {t(
                                "dataRights.admin.detailsTitle",
                                "Request details",
                            )}
                        </h2>
                        <p className="dr-card-subtitle">
                            ID: <strong>{request.requestId}</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        className="dr-modal-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* TIMELINE */}
                <div className="dr-status-timeline">
                    <div
                        className={`dr-status-step ${step1Class}`}
                    >
                        <div className="dr-status-dot">
                            <span className="dr-status-icon">
                                ⏳
                            </span>
                        </div>
                        <div className="dr-status-label">
                            Waiting for assignment
                        </div>
                    </div>

                    <div
                        className={`dr-status-step ${step2Class}`}
                    >
                        <div className="dr-status-dot">
                            <span className="dr-status-icon">
                                🛠️
                            </span>
                        </div>
                        <div className="dr-status-label">
                            In progress
                        </div>
                    </div>

                    <div
                        className={`dr-status-step ${step3Class}`}
                    >
                        <div className="dr-status-dot">
                            <span className="dr-status-icon">
                                {request.status === "Rejected"
                                    ? "❌"
                                    : "✅"}
                            </span>
                        </div>
                        <div className="dr-status-label">
                            {request.status === "Rejected"
                                ? "Rejected"
                                : "Completed"}
                        </div>
                    </div>
                </div>

                <div className="dr-modal-grid">
                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.type", "Type")}
                        </span>
                        <span className="dr-value dr-pill">
                            {request.type === "Access" && "📄 "}
                            {request.type === "Deletion" && "🧹 "}
                            {request.type === "Rectification" &&
                                "✏️ "}
                            {request.type}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.status", "Status")}
                        </span>
                        <span
                            className={`dr-value dr-pill dr-${request.status}`}
                        >
                            {request.status}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t(
                                "dataRights.admin.userEmail",
                                "User (request owner)",
                            )}
                        </span>
                        <span className="dr-value">
                            {request.userEmail}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t(
                                "dataRights.main.processedBy",
                                "Processed by",
                            )}
                        </span>
                        <span className="dr-value">
                            {request.processedBy ?? "—"}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t(
                                "dataRights.main.createdOn",
                                "Created at",
                            )}
                        </span>
                        <span className="dr-value">
                            {created}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t(
                                "dataRights.main.updatedOn",
                                "Last update",
                            )}
                        </span>
                        <span className="dr-value">
                            {updated}
                        </span>
                    </div>
                </div>

                {payloadPretty && (
                    <div className="dr-payload-box dr-payload-box-admin">
                        <h3 className="dr-label">
                            {t(
                                "dataRights.main.payload",
                                "Payload / system data",
                            )}
                        </h3>
                        <pre className="dr-payload">
                            {payloadPretty}
                        </pre>
                    </div>
                )}

                <div className="dr-modal-actions">
                    {canAssign && (
                        <button
                            type="button"
                            onClick={onAssignToMe}
                            className="dr-primary-btn"
                            disabled={isBusy}
                        >
                            👤{" "}
                            {t(
                                "dataRights.admin.assignToMe",
                                "Assign to me",
                            )}
                        </button>
                    )}

                    {canRespond && (
                        <button
                            type="button"
                            onClick={onRespond}
                            className="dr-secondary-btn"
                            disabled={isBusy}
                        >
                            🚀{" "}
                            {request.type === "Access"
                                ? t(
                                    "dataRights.admin.respondAccess",
                                    "Generate access response",
                                )
                                : request.type === "Deletion"
                                    ? t(
                                        "dataRights.admin.respondDeletion",
                                        "Perform deletion",
                                    )
                                    : t(
                                        "dataRights.admin.respondRectification",
                                        "Open rectification decision",
                                    )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="dr-ghost-btn"
                        disabled={isBusy}
                    >
                        {t("common.close", "Close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
