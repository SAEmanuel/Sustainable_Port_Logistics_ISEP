import { useTranslation } from "react-i18next";

type Props = {
    count: number;
    query: string;
    onQueryChange: (v: string) => void;
    onToggleCreate: () => void;
    isCreateOpen: boolean;
};

export function DataRightsHeader({
                                     count,
                                     query,
                                     onQueryChange,
                                     onToggleCreate,
                                     isCreateOpen,
                                 }: Props) {
    const { t } = useTranslation();

    return (
        <header className="dr-header">
            <div className="dr-header-left">
                <h1 className="dr-title">
                    🔐 {t("dataRights.title", "My Data Rights")}
                </h1>
                <p className="dr-subtitle">
                    {t(
                        "dataRights.subtitle",
                        "View the history of your privacy requests and create new ones."
                    )}
                </p>
                <span className="dr-chip-count">
                    {t("dataRights.count", "{{count}} requests", { count })}
                </span>
            </div>

            <div className="dr-header-right">
                <input
                    className="dr-search"
                    placeholder={t(
                        "dataRights.search_PH",
                        "Search by ID, type or status..."
                    )}
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                />
                <button
                    type="button"
                    className="dr-cta-btn dr-cta-pulse"
                    onClick={onToggleCreate}
                >
                    {isCreateOpen ? "✖️ " : "✨ "}
                    {t("dataRights.newRequest", "New request")}
                </button>
            </div>
        </header>
    );
}
