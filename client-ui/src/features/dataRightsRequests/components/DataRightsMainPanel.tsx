import type { DataRightsRequest } from "../domain/dataRights";
import { useTranslation } from "react-i18next";

type Props = {
    selected: DataRightsRequest | null;
};

export function DataRightsMainPanel({ selected }: Props) {
    const { t } = useTranslation();

    if (!selected) {
        return (
            <div className="dr-main-panel dr-main-empty">
                <div className="dr-ghost-card bounce-in">
                    <span className="dr-ghost-emoji">👆</span>
                    <p>
                        {t(
                            "dataRights.main.selectHint",
                            "Select a request above to see the details."
                        )}
                    </p>
                </div>
            </div>
        );
    }

    const created = new Date(
        (selected.createdOn as any).value ?? selected.createdOn
    ).toLocaleString();
    const updated = selected.updatedOn
        ? new Date(
            (selected.updatedOn as any).value ?? selected.updatedOn
        ).toLocaleString()
        : "-";

    return (
        <div className="dr-main-panel">
            <div className="dr-card-large fade-in">
                <h2 className="dr-card-title">
                    🔎 {t("dataRights.main.details", "Request details")}
                </h2>

                <p className="dr-card-subtitle">
                    {t("dataRights.main.requestId", "Request ID")}:{" "}
                    <strong>{selected.requestId}</strong>
                </p>

                <div className="dr-grid">
                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.type", "Type")}
                        </span>
                        <span className="dr-value dr-pill">
                            {selected.type === "Access" && "📄 "}
                            {selected.type === "Deletion" && "🧹 "}
                            {selected.type === "Rectification" && "✏️ "}
                            {selected.type}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.status", "Status")}
                        </span>
                        <span className={`dr-value dr-pill dr-${selected.status}`}>
                            {selected.status}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.createdOn", "Created at")}
                        </span>
                        <span className="dr-value">{created}</span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.updatedOn", "Last update")}
                        </span>
                        <span className="dr-value">{updated}</span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.processedBy", "Processed by")}
                        </span>
                        <span className="dr-value">
                            {selected.processedBy ?? "—"}
                        </span>
                    </div>
                </div>

                {selected.payload && (
                    <div className="dr-payload-box">
                        <h3 className="dr-label">
                            {t("dataRights.main.payload", "Payload / system data")}
                        </h3>
                        <pre className="dr-payload">
                            {JSON.stringify(
                                JSON.parse(selected.payload),
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
