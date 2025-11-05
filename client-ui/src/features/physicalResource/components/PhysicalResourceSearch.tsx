import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { PhysicalResourceType, PhysicalResourceStatus } from "../types/physicalResource";
import "../style/physicalResource.css";

type FilterType = "all" | "code" | "description" | "type" | "status";

interface PhysicalResourceSearchProps {
    onSearch: (type: FilterType, value: string | number) => void;
}

function PhysicalResourceSearch({ onSearch }: PhysicalResourceSearchProps) {
    const { t } = useTranslation();
    const [filterType, setFilterType] = useState<FilterType>("code");
    const [filterValue, setFilterValue] = useState<string | number>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filterValue === "" && filterType !== "all") {
            toast.error(t("physicalResource.searchBy.errorEmpty"));
            return;
        }
        onSearch(filterType, filterValue);
    };

    const handleClear = () => {
        setFilterType("code");
        setFilterValue("");
        onSearch("all", "");
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as FilterType;
        setFilterType(newType);
        setFilterValue("");
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilterValue(e.target.value);
    };

    const renderFilterInput = () => {
        switch (filterType) {
            case "type":
                return (
                    <select
                        value={filterValue}
                        onChange={handleValueChange}
                        className="pr-search-select-input"
                    >
                        <option value="">{t("physicalResource.form.selectOption")}</option>
                        {Object.values(PhysicalResourceType).map((typeVal) => (
                            <option key={typeVal} value={typeVal}>
                                {t(`physicalResource.types.${typeVal}`)}
                            </option>
                        ))}
                    </select>
                );
            case "status":
                return (
                    <select
                        value={filterValue}
                        onChange={handleValueChange}
                        className="pr-search-select-input"
                    >
                        <option value="">{t("physicalResource.form.selectOption")}</option>
                        {Object.values(PhysicalResourceStatus).map((statusVal) => (
                            <option key={statusVal} value={statusVal}>
                                {t(`physicalResource.status.${statusVal}`)}
                            </option>
                        ))}
                    </select>
                );
            case "code":
            case "description":
            default:
                return (
                    <input
                        type="text"
                        value={filterValue as string}
                        onChange={handleValueChange}
                        placeholder={t(`physicalResource.searchBy.${filterType}`)}
                        className="pr-search-input"
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="pr-search-form">
            {}
            <select
                className="pr-search-type-select"
                value={filterType}
                onChange={handleTypeChange}
                aria-label={t("physicalResource.searchBy.title")}
            >
                <option value="code">{t("physicalResource.searchBy.code")}</option>
                <option value="description">{t("physicalResource.searchBy.description")}</option>
                <option value="type">{t("physicalResource.searchBy.type")}</option>
                <option value="status">{t("physicalResource.searchBy.status")}</option>
            </select>

            {}
            {renderFilterInput()}

            {}
            <button type="submit" className="pr-search-button">
                {t("physicalResource.actions.search")}
            </button>
            <button
                type="button"
                onClick={handleClear}
                className="pr-clear-button"
            >
                {t("physicalResource.actions.clear")}
            </button>
        </form>
    );
}

export default PhysicalResourceSearch;