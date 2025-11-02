import { useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import type { Qualification } from "../types/qualification";
import { getQualificationByCode, getQualificationByName } from "../services/qualificationService";

interface Props {
    searchMode: "list" | "code" | "name";
    onSearchModeChange: (mode: "list" | "code" | "name") => void;
    onResultSelect: (qual: Qualification) => void;
    onBackToList: () => void;
}

export default function QualificationSearch({
                                                searchMode,
                                                onSearchModeChange,
                                                onResultSelect,
                                                onBackToList
                                            }: Props) {
    const [searchValue, setSearchValue] = useState("");
    const [searchResult, setSearchResult] = useState<Qualification | null>(null);
    const [searching, setSearching] = useState(false);

    const { t } = useTranslation();

    const handleSearch = async () => {
        if (!searchValue.trim()) {
            notifyError(t("qualifications.searchEmpty"));
            return;
        }

        setSearching(true);
        notifyLoading(t("qualifications.searching"));

        try {
            let result: Qualification;

            if (searchMode === "code") {
                result = await getQualificationByCode(searchValue.trim());
            } else {
                result = await getQualificationByName(searchValue.trim());
            }

            setSearchResult(result);
            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.searchSuccess"));
        } catch {
            toast.dismiss("loading-global");
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleBackToList = () => {
        setSearchValue("");
        setSearchResult(null);
        onBackToList();
    };

    return (
        <>
            {/* BOTÕES DE MODO */}
            <div className="qual-search-buttons">
                <button
                    className={searchMode === "list" ? "active" : ""}
                    onClick={handleBackToList}
                >
                    {t("qualifications.showAll")}
                </button>
                <button
                    className={searchMode === "code" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("code");
                        setSearchResult(null);
                    }}
                >
                    {t("qualifications.searchByCode")}
                </button>
                <button
                    className={searchMode === "name" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("name");
                        setSearchResult(null);
                    }}
                >
                    {t("qualifications.searchByName")}
                </button>
            </div>

            {/* ÁREA DE BUSCA */}
            {searchMode !== "list" && (
                <div className="qual-search-box">
                    <input
                        type="text"
                        className="qual-search-input"
                        placeholder={
                            searchMode === "code"
                                ? t("qualifications.searchCodePlaceholder")
                                : t("qualifications.searchNamePlaceholder")
                        }
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button
                        className="qual-search-btn"
                        onClick={handleSearch}
                        disabled={searching}
                    >
                        <FaSearch /> {t("qualifications.search")}
                    </button>
                </div>
            )}

            {/* RESULTADO DA BUSCA */}
            {searchMode !== "list" && searchResult && (
                <div className="qual-search-result">
                    <h3>{t("qualifications.searchResultTitle")}</h3>
                    <div className="qual-result-card">
                        <div className="qual-result-row">
                            <strong>{t("qualifications.details.code")}:</strong>
                            <span className="qual-badge">{searchResult.code}</span>
                        </div>
                        <div className="qual-result-row">
                            <strong>{t("qualifications.details.name")}:</strong>
                            <span>{searchResult.name}</span>
                        </div>
                        <div className="qual-result-actions">
                            <button
                                className="qual-btn-edit"
                                onClick={() => onResultSelect(searchResult)}
                            >
                                {t("qualifications.viewDetails")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}