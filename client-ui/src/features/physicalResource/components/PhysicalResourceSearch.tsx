import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../style/physicalResource.css";

interface PhysicalResourceSearchProps {
    onSearch: (code: string) => void;
}

function PhysicalResourceSearch({ onSearch }: PhysicalResourceSearchProps) {
    const { t } = useTranslation();
    const [searchCode, setSearchCode] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchCode);
    };

    const handleClear = () => {
        setSearchCode("");
        onSearch("");
    };

    return (
        <form onSubmit={handleSubmit} className="pr-search-container">
            <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder={t("physicalResource.searchPlaceholder")}
                aria-label="Search physical resource by code"
                className="pr-search-input"
            />
            <button type="submit" className="pr-search-button">
                {t("common.search")}
            </button>
            <button
                type="button"
                onClick={handleClear}
                className="pr-clear-button"
            >
                {t("common.clear")}
            </button>
        </form>
    );
}

export default PhysicalResourceSearch;