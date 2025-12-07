import { useTranslation } from "react-i18next";

type Stats = {
    total: number;
    waiting: number;
    inProgress: number;
    completed: number;
    rejected: number;
};

type Props = {
    stats: Stats;
    query: string;
    onQueryChange: (v: string) => void;
};

export function AdminDataRightsHeader({
                                          stats,
                                          query,
                                          onQueryChange,
                                      }: Props) {
    const { t } = useTranslation();

    return (
        <header className="dr-header dr-admin-header">
            <div className="dr-header-left">
                <h1 className="dr-title">
                    🛡️{" "}
                    {t(
                        "dataRights.admin.title",
                        "Data Rights – Admin",
                    )}
                </h1>
                <p className="dr-subtitle">
                    {t(
                        "dataRights.admin.subtitle",
                        "Manage GDPR / privacy requests, assign yourself and respond.",
                    )}
                </p>
                <span className="dr-chip-count">
                    {t("dataRights.count", "{{count}} total", {
                        count: stats.total,
                    })}
                </span>
            </div>

            <div className="dr-header-right">
                <input
                    className="dr-search"
                    placeholder={t(
                        "dataRights.admin.search_PH",
                        "Search by ID, email, type or status...",
                    )}
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                />
            </div>
        </header>
    );
}
