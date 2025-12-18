import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../style/complementaryTask.css";

type FilterType = "all" | "code" | "category" | "staff" | "vve";

interface Props {
    onSearch: (type: FilterType, value: string) => void;
}

function ComplementaryTaskSearch({ onSearch }: Props) {
    const { t } = useTranslation();
    const [searchType, setSearchType] = useState<FilterType>("all");
    const [searchValue, setSearchValue] = useState("");

    const handleSearchClick = () => {
        onSearch(searchType, searchValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    return (
        <div className="ct-search-container">
            <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as FilterType)}
                className="ct-search-select"
            >
                <option value="all">{t("ct.search.all") || "All"}</option>
                <option value="code">{t("ct.search.code") || "Code"}</option>
                <option value="category">{t("ct.search.category") || "Category"}</option>
                <option value="staff">{t("ct.search.staff") || "Staff"}</option>
                <option value="vve">{t("ct.search.vve") || "VVE"}</option>
            </select>

            <input
                type="text"
                placeholder={t("common.search") || "Search..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={searchType === "all"}
                className="ct-search-input"
            />

            <button onClick={handleSearchClick} className="ct-search-button">
                🔍
            </button>
        </div>
    );
}

export default ComplementaryTaskSearch;