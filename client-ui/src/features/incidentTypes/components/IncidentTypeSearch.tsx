import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import "../style/incidentType.css";

type FilterType = "roots" | "code" | "name" | "children" | "subtree";

interface Props {
    onSearch: (type: FilterType, value: string) => void;
}

function IncidentTypeSearch({ onSearch }: Props) {
    const { t } = useTranslation();
    const [filterType, setFilterType] = useState<FilterType>("roots");
    const [filterValue, setFilterValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // roots doesn't need a value
        if (filterType !== "roots" && filterValue.trim() === "") {
            toast.error(t("errors.emptySearch"));
            return;
        }

        onSearch(filterType, filterValue.trim());
    };

    const handleClear = () => {
        setFilterType("roots");
        setFilterValue("");
        onSearch("roots", "");
    };

    const needsValue = filterType !== "roots";

    return (
        <form onSubmit={handleSubmit} className="it-search-form">
            <select
                className="it-search-type-select"
                value={filterType}
                onChange={(e) => {
                    setFilterType(e.target.value as FilterType);
                    setFilterValue("");
                }}
            >
                <option value="roots">{t("incidentType.search.roots")}</option>
                <option value="code">{t("incidentType.search.code")}</option>
                <option value="name">{t("incidentType.search.name")}</option>
                <option value="children">{t("incidentType.search.children")}</option>
                <option value="subtree">{t("incidentType.search.subtree")}</option>
            </select>

            {needsValue && (
                <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={t(`incidentType.searchPlaceholder.${filterType}`)}
                    className="it-search-input"
                />
            )}

            <button type="submit" className="it-search-button">{t("actions.search")}</button>
            <button type="button" onClick={handleClear} className="it-clear-button">{t("actions.clear")}</button>
        </form>
    );
}

export default IncidentTypeSearch;
