import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../style/complementaryTask.css";

export type FilterType = "all" | "code" | "category" | "staff" | "vve" | "scheduled" | "completed" | "inProgress" | "range";

interface Props {
    onSearch: (type: FilterType, value: any) => void;
}

function ComplementaryTaskSearch({ onSearch }: Props) {
    const { t } = useTranslation();
    const [searchType, setSearchType] = useState<FilterType>("all");
    const [searchValue, setSearchValue] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSearchClick = () => {
        if (searchType === "range") {
            onSearch("range", {
                start: new Date(startDate).getTime(),
                end: new Date(endDate).getTime()
            });
        } else if (["scheduled", "completed", "inProgress", "all"].includes(searchType)) {
            onSearch(searchType, "");
        } else {
            onSearch(searchType, searchValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };


    const isStatusFilter = ["scheduled", "completed", "inProgress", "all"].includes(searchType);

    return (
        <div className="ct-search-container">
            <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as FilterType)}
                className="ct-search-select"
            >
                <option value="all">{t("ct.search.all") || "All"}</option>
                <option value="code">{t("ct.search.code") || "Code"}</option>
                <option value="category">{t("ct.search.category") || "Category ID"}</option>
                <option value="staff">{t("ct.search.staff") || "Staff"}</option>
                <option value="vve">{t("ct.search.vve") || "VVE ID"}</option>
                <option value="scheduled">{t("ct.status.Scheduled") || "Scheduled"}</option>
                <option value="inProgress">{t("ct.status.InProgress") || "In Progress"}</option>
                <option value="completed">{t("ct.status.Completed") || "Completed"}</option>
                <option value="range">{t("ct.search.range") || "Date Range"}</option>
            </select>

            {searchType === "range" ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexGrow: 1 }}>
                    <input
                        type="datetime-local"
                        className="ct-search-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                        type="datetime-local"
                        className="ct-search-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            ) : (
                <input
                    type="text"
                    placeholder={isStatusFilter ? t("actions.search") || "Status filter active..." : t("common.search") || "Search..."}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStatusFilter}
                    className="ct-search-input"
                    style={{ flexGrow: 1 }}
                />
            )}

            <button onClick={handleSearchClick} className="ct-search-button" title={t("actions.search")}>
                🔍
            </button>

            <button
                onClick={() => {
                    setSearchType("all");
                    setSearchValue("");
                    setStartDate("");
                    setEndDate("");
                    onSearch("all", "");
                }}
                className="ct-clear-button"
                title={t("actions.clear")}
            >
                X
            </button>
        </div>
    );
}

export default ComplementaryTaskSearch;