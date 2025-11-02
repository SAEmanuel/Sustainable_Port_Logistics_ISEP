import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaSearch, FaCheckSquare, FaSquare } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import type { Qualification } from "../../qualifications/types/qualification";
import {
    getStaffMemberByMecNumber,
    getStaffMembersByStatus,
    getStaffMembersByName,
    getStaffMembersByQualifications,
    getStaffMembersByExactQualifications
} from "../services/staffMemberService";
import { getQualifications } from "../../qualifications/services/qualificationService";

interface Props {
    searchMode: "list" | "mecNumber" | "name" | "status" | "qualifications";
    onSearchModeChange: (mode: "list" | "mecNumber" | "name" | "status" | "qualifications") => void;
    onResultSelect: (sm: StaffMember) => void;
    onBackToList: () => void;
}

export default function StaffMemberSearch({
                                              searchMode,
                                              onSearchModeChange,
                                              onResultSelect,
                                              onBackToList
                                          }: Props) {
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState<StaffMember[]>([]);
    const [searching, setSearching] = useState(false);
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

    const [availableQualifications, setAvailableQualifications] = useState<Qualification[]>([]);
    const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
    const [loadingQualifications, setLoadingQualifications] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        if (searchMode === "qualifications") {
            loadQualifications();
        }
    }, [searchMode]);

    const loadQualifications = async () => {
        setLoadingQualifications(true);
        try {
            const data = await getQualifications();
            setAvailableQualifications(data);
        } catch {
            notifyError(t("staffMembers.loadQualificationsFail"));
        } finally {
            setLoadingQualifications(false);
        }
    };


    const toggleQualification = (code: string) => {
        setSelectedQualifications(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };


    const handleSearchByQualifications = async () => {
        if (selectedQualifications.length === 0) {
            notifyError(t("staffMembers.selectQualifications"));
            return;
        }

        setSearching(true);
        notifyLoading(t("staffMembers.searching"));

        try {
            const results = await getStaffMembersByQualifications(selectedQualifications);
            setSearchResults(results);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.searchSuccess", { count: results.length }));
        } catch {
            toast.dismiss("loading-global");
            setSearchResults([]);
            notifyError(t("staffMembers.searchFail"));
        } finally {
            setSearching(false);
        }
    };

    const handleSearchByExactQualifications = async () => {
        if (selectedQualifications.length === 0) {
            notifyError(t("staffMembers.selectQualifications"));
            return;
        }

        setSearching(true);
        notifyLoading(t("staffMembers.searching"));

        try {
            const results = await getStaffMembersByExactQualifications(selectedQualifications);
            setSearchResults(results);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.searchSuccess", { count: results.length }));
        } catch {
            toast.dismiss("loading-global");
            setSearchResults([]);
            notifyError(t("staffMembers.searchFail"));
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = async () => {
        if (searchMode !== "status" && !searchValue.trim()) {
            notifyError(t("staffMembers.searchEmpty"));
            return;
        }
        if (searchMode === "status" && statusFilter === null) {
            notifyError(t("staffMembers.selectStatus"));
            return;
        }

        setSearching(true);
        notifyLoading(t("staffMembers.searching"));

        try {
            let results: StaffMember[] = [];

            if (searchMode === "mecNumber") {
                const result = await getStaffMemberByMecNumber(searchValue.trim());
                if (result) results = [result];
            } else if (searchMode === "name") {
                results = await getStaffMembersByName(searchValue.trim());
            } else if (searchMode === "status") {
                results = await getStaffMembersByStatus(Boolean(statusFilter));
            }

            setSearchResults(results);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.searchSuccess", { count: results.length }));
        } catch {
            toast.dismiss("loading-global");
            setSearchResults([]);
            notifyError(t("staffMembers.searchFail"));
        } finally {
            setSearching(false);
        }
    };

    const handleBackToList = () => {
        setSearchValue("");
        setStatusFilter(null);
        setSearchResults([]);
        setSelectedQualifications([]);
        onBackToList();
    };

    const handleStatusSelect = async (status: boolean) => {
        setStatusFilter(status);
        setSearching(true);
        notifyLoading(t("staffMembers.searching"));
        try {
            const results = await getStaffMembersByStatus(status);
            setSearchResults(results);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.searchSuccess", { count: results.length }));
        } catch {
            toast.dismiss("loading-global");
            setSearchResults([]);
            notifyError(t("staffMembers.searchFail"));
        } finally {
            setSearching(false);
        }
    };

    return (
        <>
            {/* BOTÕES DE MODO */}
            <div className="staff-search-buttons">
                <button
                    className={searchMode === "list" ? "active" : ""}
                    onClick={handleBackToList}
                >
                    {t("staffMembers.showAll")}
                </button>
                <button
                    className={searchMode === "mecNumber" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("mecNumber");
                        setSearchResults([]);
                        setSearchValue("");
                        setStatusFilter(null);
                        setSelectedQualifications([]);
                    }}
                >
                    {t("staffMembers.searchByMecNumber")}
                </button>
                <button
                    className={searchMode === "name" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("name");
                        setSearchResults([]);
                        setSearchValue("");
                        setStatusFilter(null);
                        setSelectedQualifications([]);
                    }}
                >
                    {t("staffMembers.searchByName")}
                </button>
                <button
                    className={searchMode === "status" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("status");
                        setSearchResults([]);
                        setSearchValue("");
                        setStatusFilter(null);
                        setSelectedQualifications([]);
                    }}
                >
                    {t("staffMembers.searchByStatus")}
                </button>
                <button
                    className={searchMode === "qualifications" ? "active" : ""}
                    onClick={() => {
                        onSearchModeChange("qualifications");
                        setSearchResults([]);
                        setSearchValue("");
                        setStatusFilter(null);
                        setSelectedQualifications([]);
                    }}
                >
                    {t("staffMembers.searchByQualifications")}
                </button>
            </div>

            {/* ÁREA DE BUSCA */}
            {searchMode !== "list" && searchMode !== "qualifications" && (
                <div className="staff-search-box">
                    {searchMode === "status" ? (
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                className={`staff-search-btn ${statusFilter === true ? "active" : ""}`}
                                onClick={() => handleStatusSelect(true)}
                            >
                                {t("staffMembers.statusActive")}
                            </button>
                            <button
                                className={`staff-search-btn ${statusFilter === false ? "active" : ""}`}
                                onClick={() => handleStatusSelect(false)}
                            >
                                {t("staffMembers.statusInactive")}
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                className="staff-search-input"
                                placeholder={
                                    searchMode === "mecNumber" ? t("staffMembers.searchMecNumberPlaceholder") :
                                        searchMode === "name" ? t("staffMembers.searchNamePlaceholder") : ""
                                }
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <button
                                className="staff-search-btn"
                                onClick={handleSearch}
                                disabled={searching}
                            >
                                <FaSearch /> {t("staffMembers.search")}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ⭐ ÁREA DE SELEÇÃO DE QUALIFICATIONS */}
            {searchMode === "qualifications" && (
                <div className="staff-qualifications-selector">
                    <h3>{t("staffMembers.selectQualificationsTitle")}</h3>
                    <p className="staff-qualifications-description">
                        {t("staffMembers.selectQualificationsDescription")}
                    </p>

                    {loadingQualifications ? (
                        <p className="staff-loading">{t("staffMembers.loadingQualifications")}</p>
                    ) : (
                        <>
                            <div className="staff-qualifications-grid">
                                {availableQualifications.map(qual => (
                                    <div
                                        key={qual.id}
                                        className={`staff-qualification-item ${selectedQualifications.includes(qual.code) ? 'selected' : ''}`}
                                        onClick={() => toggleQualification(qual.code)}
                                    >
                                        <div className="staff-qualification-checkbox">
                                            {selectedQualifications.includes(qual.code) ? (
                                                <FaCheckSquare />
                                            ) : (
                                                <FaSquare />
                                            )}
                                        </div>
                                        <div className="staff-qualification-info">
                                            <span className="staff-qualification-code">{qual.code}</span>
                                            <span className="staff-qualification-name">{qual.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedQualifications.length > 0 && (
                                <div className="staff-qualifications-selected">
                                    <p>
                                        <strong>{t("staffMembers.selectedQualifications")}:</strong>{" "}
                                        {selectedQualifications.join(", ")}
                                    </p>
                                </div>
                            )}

                            <div className="staff-qualifications-actions">
                                <button
                                    className="staff-btn-search-partial"
                                    onClick={handleSearchByQualifications}
                                    disabled={searching || selectedQualifications.length === 0}
                                >
                                    {t("staffMembers.searchPartialQualifications")}
                                </button>
                                <button
                                    className="staff-btn-search-exact"
                                    onClick={handleSearchByExactQualifications}
                                    disabled={searching || selectedQualifications.length === 0}
                                >
                                    {t("staffMembers.searchExactQualifications")}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* RESULTADOS DA BUSCA */}
            {searchMode !== "list" && searchResults.length > 0 && (
                <div className="staff-search-result">
                    <h3>{t("staffMembers.searchResultTitle")}</h3>
                    {searchResults.map(sm => (
                        <div className="staff-result-card" key={sm.id}>
                            <div className="staff-result-row">
                                <strong>{t("staffMembers.details.mecNumber")}:</strong>
                                <span className="staffMember-badge">{sm.mecanographicNumber}</span>
                            </div>
                            <div className="staff-result-row">
                                <strong>{t("staffMembers.details.name")}:</strong>
                                <span>{sm.shortName}</span>
                            </div>
                            <div className="staff-result-actions">
                                <button
                                    className="staff-btn-viewDetails"
                                    onClick={() => onResultSelect(sm)}
                                >
                                    {t("staffMembers.viewDetails")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* RESULTADO VAZIO */}
            {searchMode !== "list" && !searching && searchResults.length === 0 && searchMode !== "qualifications" && (
                <p className="staffMember-empty">{t("staffMembers.empty")}</p>
            )}
        </>
    );
}