import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import "../style/user.css";

type FilterType = "all" | "email" | "noRole";

interface UserSearchProps {
    onSearch: (type: FilterType, value: string) => void;
}

export default function UserSearch({ onSearch }: UserSearchProps) {
    const { t } = useTranslation();
    const [filterType, setFilterType] = useState<FilterType>("email");
    const [filterValue, setFilterValue] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (filterType === "email" && filterValue.trim() === "") {
            toast.error(t("users.search.errorEmpty"));
            return;
        }

        onSearch(filterType, filterValue.trim());
    };

    const handleClear = () => {
        setFilterType("email");
        setFilterValue("");
        onSearch("all", "");
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as FilterType;
        setFilterType(newType);
        setFilterValue("");
    };

    const renderFilterInput = () => {
        if (filterType === "email") {
            return (
                <input
                    type="email"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={t("users.search.emailPlaceholder")}
                    className="user-search-input"
                />
            );
        }
        return null;
    };

    return (
        <form onSubmit={handleSubmit} className="user-search-form">
            <select
                className="user-search-type-select"
                value={filterType}
                onChange={handleTypeChange}
                aria-label={t("users.search.title")}
            >
                <option value="email">{t("users.search.byEmail")}</option>
                <option value="noRole">{t("users.search.noRole")}</option>
                <option value="all">{t("users.search.all")}</option>
            </select>

            {renderFilterInput()}

            <button type="submit" className="user-search-button">
                {t("users.actions.search")}
            </button>

            <button type="button" onClick={handleClear} className="user-clear-button">
                {t("users.actions.clear")}
            </button>
        </form>
    );
}