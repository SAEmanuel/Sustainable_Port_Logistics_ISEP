// src/features/dataRightsRequests/components/DataRightsStrip.tsx
import { useTranslation } from "react-i18next";
import type { DataRightsRequest } from "../domain/dataRights";

function classNames(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

type Props = {
    items: DataRightsRequest[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (r: DataRightsRequest) => void;
};

export function DataRightsStrip({ items, loading, selectedId, onSelect }: Props) {
    const { t } = useTranslation();

    const statusEmoji: Record<string, string> = {
        WaitingForAssignment: "⏳",
        InProgress: "🛠️",
        Completed: "✅",
        Rejected: "❌",
    };

    return (
        <div className="dr-strip">
            <div className="dr-strip-inner">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div className="dr-strip-skeleton" key={i} />
                    ))
                ) : items.length === 0 ? (
                    <div className="dr-empty">
                        😴{" "}
                        {t(
                            "dataRights.list.empty",
                            "You don't have any data rights requests yet."
                        )}
                    </div>
                ) : (
                    items.map(r => {
                        const active = selectedId === r.id;
                        return (
                            <button
                                key={r.id}
                                className={classNames(
                                    "dr-card-mini",
                                    active && "active"
                                )}
                                onClick={() => onSelect(r)}
                            >
                                <div className="dr-card-mini-top">
                                    <span className="dr-card-mini-id">
                                        #{r.requestId}
                                    </span>
                                    <span className={`dr-badge-type ${r.type}`}>
                                        {r.type === "Access" && "📄"}
                                        {r.type === "Deletion" && "🧹"}
                                        {r.type === "Rectification" && "✏️"}{" "}
                                        {r.type}
                                    </span>
                                </div>
                                <div className="dr-card-mini-bottom">
                                    <span className={`dr-status dr-${r.status}`}>
                                        {statusEmoji[r.status]} {r.status}
                                    </span>
                                    <span className="dr-date">
                                        {new Date(
                                            (r.createdOn as any).value ?? r.createdOn
                                        ).toLocaleString()}
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
