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
        <div className="dr-strip dr-admin-strip">
            <div className="dr-strip-inner">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div className="dr-strip-skeleton" key={i} />
                    ))
                ) : items.length === 0 ? (
                    <div className="dr-empty">
                        😴{" "}
                        {t(
                            "dataRights.admin.empty",
                            "No data rights requests to show.",
                        )}
                    </div>
                ) : (
                    items.map(r => {
                        const active = selectedId === r.id;
                        const created = new Date(
                            (r.createdOn as any).value ?? r.createdOn,
                        ).toLocaleString();

                        return (
                            <button
                                key={r.id}
                                className={cn(
                                    "dr-card-mini dr-card-mini-admin",
                                    active && "active",
                                )}
                                onClick={() => onSelect(r)}
                            >
                                <div className="dr-card-mini-top">
                                    <span className="dr-card-mini-id">
                                        #{r.requestId}
                                    </span>
                                    <span
                                        className={`dr-badge-type ${r.type}`}
                                    >
                                        {r.type === "Access" && "📄 "}
                                        {r.type === "Deletion" && "🧹 "}
                                        {r.type === "Rectification" &&
                                            "✏️ "}
                                        {r.type}
                                    </span>
                                </div>

                                <div className="dr-card-mini-middle">
                                    <span className="dr-mini-email">
                                        {r.userEmail}
                                    </span>
                                </div>

                                <div className="dr-card-mini-bottom">
                                    <span
                                        className={`dr-status dr-${r.status}`}
                                    >
                                        {statusEmoji[r.status]}{" "}
                                        {r.status}
                                    </span>
                                    <span className="dr-date">
                                        {created}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
