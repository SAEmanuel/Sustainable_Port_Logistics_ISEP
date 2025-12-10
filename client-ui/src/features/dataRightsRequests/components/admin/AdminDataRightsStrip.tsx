// src/features/dataRightsRequests/admin/components/AdminDataRightsStrip.tsx
import { useTranslation } from "react-i18next";
import type { DataRightsRequest } from "../../domain/dataRights";

type Props = {
    items: DataRightsRequest[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (r: DataRightsRequest) => void;
};

const statusEmoji: Record<string, string> = {
    WaitingForAssignment: "⏳",
    InProgress: "🛠️",
    Completed: "✅",
    Rejected: "❌",
};

function cn(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

export function AdminDataRightsStrip({
                                         items,
                                         loading,
                                         selectedId,
                                         onSelect,
                                     }: Props) {
    const { t } = useTranslation();

    return (
        <div className="dr-admin-grid-wrapper">
            {loading ? (
                <div className="dr-admin-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="dr-admin-card dr-admin-card-skeleton"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="dr-empty dr-admin-empty">
                    😴{" "}
                    {t(
                        "dataRights.admin.empty",
                        "No data rights requests to show.",
                    )}
                </div>
            ) : (
                <div className="dr-admin-grid">
                    {items.map(r => {
                        const active = selectedId === r.id;
                        const created = new Date(
                            (r.createdOn as any).value ?? r.createdOn,
                        ).toLocaleString();

                        return (
                            <button
                                key={r.id}
                                type="button"
                                className={cn(
                                    "dr-admin-card",
                                    `dr-admin-card-${r.status}`,
                                    active && "active",
                                )}
                                onClick={() => onSelect(r)}
                            >
                                <div className="dr-admin-card-header">
                                    <span className="dr-admin-card-id">
                                        #{r.requestId}
                                    </span>

                                    <span
                                        className={cn(
                                            "dr-admin-status-pill",
                                            `dr-${r.status}`,
                                        )}
                                    >
                                        {statusEmoji[r.status]} {r.status}
                                    </span>
                                </div>

                                <div className="dr-admin-card-body">
                                    <div className="dr-admin-row">
                                        <span className="dr-admin-label">
                                            {t(
                                                "dataRights.admin.userEmail",
                                                "User",
                                            )}
                                        </span>
                                        <span className="dr-admin-value">
                                            {r.userEmail}
                                        </span>
                                    </div>

                                    <div className="dr-admin-row">
                                        <span className="dr-admin-label">
                                            {t("dataRights.main.type", "Type")}
                                        </span>
                                        <span className="dr-admin-chip">
                                            {r.type === "Access" && "📄 "}
                                            {r.type === "Deletion" && "🧹 "}
                                            {r.type === "Rectification" && "✏️ "}
                                            {r.type}
                                        </span>
                                    </div>

                                    <div className="dr-admin-row dr-admin-row-meta">
                                        <span className="dr-admin-label">
                                            {t(
                                                "dataRights.main.createdOn",
                                                "Created at",
                                            )}
                                        </span>
                                        <span className="dr-admin-meta">
                                            {created}
                                        </span>
                                    </div>

                                    {r.processedBy && (
                                        <div className="dr-admin-row dr-admin-row-meta">
                                            <span className="dr-admin-label">
                                                {t(
                                                    "dataRights.main.processedBy",
                                                    "Processed by",
                                                )}
                                            </span>
                                            <span className="dr-admin-meta">
                                                {r.processedBy}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
