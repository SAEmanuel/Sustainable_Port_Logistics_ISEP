import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import "../style/complementaryTaskCategory.css";

type FilterType = "all" | "code" | "name" | "description" | "category";

interface Props {
    onSearch: (type: FilterType, value: string) => void;
}

function ComplementaryTaskCategorySearch({ onSearch }: Props) {
    const { t } = useTranslation();
    const [filterType, setFilterType] = useState<FilterType>("code");
    const [filterValue, setFilterValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filterValue === "" && filterType !== "all") {
            toast.error(t("errors.emptySearch"));
            return;
        }
        onSearch(filterType, filterValue);
    };

    const handleClear = () => {
        setFilterType("code");
        setFilterValue("");
        onSearch("all", "");
    };

    return (
        <form onSubmit={handleSubmit} className="ctc-search-form">
            <select
                className="ctc-search-type-select"
                value={filterType}
                onChange={(e) => {
                    setFilterType(e.target.value as FilterType);
                    setFilterValue("");
                }}
            >
                <option value="code">{t("ctc.search.code")}</option>
                <option value="name">{t("ctc.search.name")}</option>
                <option value="description">{t("ctc.search.description")}</option>
                <option value="category">{t("ctc.search.category")}</option>
            </select>

            {filterType === "category" ? (
                <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="ctc-search-select-input"
                >
                    <option value="">{t("common.select")}</option>
                    <option value="Safety and Security">Safety and Security</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Cleaning and Housekeeping">Cleaning</option>
                </select>
            ) : (
                <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={t(`ctc.searchPlaceholder.${filterType}`)}
                    className="ctc-search-input"
                />
            )}

            <button type="submit" className="ctc-search-button">{t("actions.search")}</button>
            <button type="button" onClick={handleClear} className="ctc-clear-button">{t("actions.clear")}</button>
        </form>
    );
}

export default ComplementaryTaskCategorySearch;