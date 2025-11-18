import { useState, useEffect } from "react";


import {
    getSAOs,
    getById,
    getByCode,
    getByLegalName,
    getByTaxNumber,
    createSAO
} from "../services/saoService";

import type { SAO } from "../types/sao";
import type {CreateSAORequest } from "../types/sao";
import {notifySuccess } from "../../../utils/notify";
import "../style/saopage.css";

import {useTranslation} from "react-i18next";
import { Bar } from "react-chartjs-2";
import { FaShip, FaSearch, FaPlus, FaTimes,FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";

import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";

// === Chart.js imports ===

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SAO() {
    const [items, setItems] = useState<SAO[]>([]);
    const [filtered, setFiltered] = useState<SAO[]>([]);
    const [selected, setSelected] = useState<SAO | null>(null);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { t } = useTranslation();

    const [shippingOrganizationCode, setShippingOrganizationCode] = useState("");
    const [legalName, setLegalName] = useState("");
    const [altName, setAltName] = useState("");
    const [address, setAddress] = useState("");
    const [taxnumber, setTaxnumber] = useState("");

    const [searchMode, setSearchMode] = useState<
        "local" | "id" | "code" | "legalName" | "taxnumber"
    >("local");


   const [searchValue, setSearchValue] = useState("");

    const MIN_LOADING_TIME = 800;

    async function runWithLoading<T>(promise: Promise<T>, loadingText: string) {
        const id = toast.loading(loadingText);
        const start = Date.now();

        try {
            const result = await promise;
            return result;
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < MIN_LOADING_TIME) {
                await new Promise(res => setTimeout(res, MIN_LOADING_TIME - elapsed));
            }
            toast.dismiss(id);
        }
    }

    useEffect(() => {
        runWithLoading(getSAOs(), t("sao.loading"))
            .then(data => {
                setItems(data);
                setFiltered(data);
                notifySuccess(t("sao.loadSuccess", { count: data.length }));
            })
            .finally(() => setLoading(false));
    }, [t]);


   const executeSearch = async () => {
        if (!searchValue.trim()) {
            setFiltered(items);
            return;
        }

        // Local search only
        if (searchMode === "local") {
            const q = searchValue.toLowerCase();
            const results = items.filter(s =>
                s.legalName.toLowerCase().includes(q) ||
                s.altName?.toLowerCase().includes(q) ||
                s.taxnumber?.value?.toLowerCase().includes(q) ||
                s.shippingOrganizationCode?.value?.toLowerCase().includes(q)
            );

            setFiltered(results);
            toast.success(t("sao.loadSuccess", { count: results.length }));
            return;
        }

        // Remote search
        let result: SAO | null = null;

        const p =
            searchMode === "id"
                ? getById(searchValue)
                : searchMode === "code"
                ? getByCode(searchValue)
                : searchMode === "legalName"
                ? getByLegalName(searchValue)
                : getByTaxNumber({ value: searchValue });

        result = await runWithLoading(p, t("sao.loading")).catch(() => null);

        if (!result) {
            setFiltered([]);
            return;
        }

        setFiltered([result]);
        toast.success(t("sao.loadSuccess", { count: 1 }));
    };

    const handleCreate = async () => {
        if (!shippingOrganizationCode.trim())
            return toast.error(t("sao.errors.codeRequired"));

        if (!legalName.trim())
            return toast.error(t("sao.errors.legalNameRequired"));

        if (!taxnumber.trim())
            return toast.error(t("sao.errors.taxRequired"));

        const payload = {
            shippingOrganizationCode,
            legalName,
            altName,
            address,
            taxnumber
        };

        const created = await runWithLoading(
            createSAO(payload),
            t("sao.loading")
        ).catch(() => null);

        if (!created) return;

        toast.success(t("sao.created"));

        const data = await getSAOs();
        setItems(data);
        setFiltered(data);

        setIsCreateOpen(false);

        // reset form
        setShippingOrganizationCode("");
        setLegalName("");
        setAltName("");
        setAddress("");
        setTaxnumber("");
    };


    const closeSlide = () => setSelected(null);

    return (
        <div className="sao-page">
            {selected && <div className="sao-overlay" />}

            <div className="sao-title-area">
                <div className="sao-title-box">
                    <h2 className="sao-title">
                        <FaBuilding className="sao-icon" /> {t("sao.title")}
                    </h2>
                    <p className="sao-sub">
                        {t("sao.count", { count: items.length })}
                    </p>
                </div>

                <button
                    className="sao-create-btn-top"
                    onClick={() => setIsCreateOpen(true)}
                >
                    + {t("sao.add")}
                </button>
            </div>

            {/* SEARCH MODE BUTTONS */}
            <div className="sao-search-mode">
                <button
                    className={searchMode === "local" ? "active" : ""}
                    onClick={() => setSearchMode("local")}
                >
                    Local
                </button>
                <button
                    className={searchMode === "id" ? "active" : ""}
                    onClick={() => setSearchMode("id")}
                >
                    ID
                </button>
                <button
                    className={searchMode === "code" ? "active" : ""}
                    onClick={() => setSearchMode("code")}
                >
                    Code
                </button>
                <button
                    className={searchMode === "legalName" ? "active" : ""}
                    onClick={() => setSearchMode("legalName")}
                >
                    Legal Name
                </button>
                <button
                    className={searchMode === "taxnumber" ? "active" : ""}
                    onClick={() => setSearchMode("taxnumber")}
                >
                    Tax Number
                </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="sao-search-box">
                <div className="sao-search-wrapper">
                    <input
                        placeholder={t("sao.searchPlaceholder")}
                        className="sao-search"
                        value={searchValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchValue(value);
                            if (value === "") setFiltered(items);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                    />
                    {searchValue !== "" && (
                        <button
                            className="sao-clear-input"
                            onClick={() => {
                                setSearchValue("");
                                setFiltered(items);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <button className="sao-search-btn" onClick={executeSearch}>
                    🔍
                </button>
            </div>

            {/* TABLE */}
            {loading ? null : filtered.length === 0 ? (
                <p>{t("sao.empty")}</p>
            ) : (
                <div className="sao-table-wrapper">
                    <table className="sao-table">
                        <thead>
                            <tr>
                                <th>{t("sao.details.code")}</th>
                                <th>{t("sao.details.legalName")}</th>
                                <th>{t("sao.details.altName")}</th>
                                <th>{t("sao.details.address")}</th>
                                <th>{t("sao.details.taxnumber")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr
                                    key={s.shippingOrganizationCode.value}
                                    className="sao-row"
                                    onClick={() => setSelected(s)}
                                >
                                    <td><span className="sao-badge">{s.shippingOrganizationCode.value}</span></td>
                                    <td>{s.legalName}</td>
                                    <td>{s.altName}</td>
                                    <td>{s.address}</td>
                                    <td>{s.taxnumber.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SLIDE PANEL */}
            {selected && (
                <div className="sao-slide">
                    <button
                        className="sao-slide-close"
                        onClick={() => setSelected(null)}
                    >
                        <FaTimes />
                    </button>

                    <h3>{selected.legalName}</h3>

                    <p><strong>{t("sao.details.code")}:</strong> {selected.shippingOrganizationCode.value}</p>
                    <p><strong>{t("sao.details.altName")}:</strong> {selected.altName}</p>
                    <p><strong>{t("sao.details.address")}:</strong> {selected.address}</p>
                    <p><strong>{t("sao.details.taxnumber")}:</strong> {selected.taxnumber.value}</p>
                </div>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="sao-modal-overlay">
                    <div className="sao-modal">
                        <h3>{t("sao.add")}</h3>

                        <label>{t("sao.details.code")} *</label>
                        <input
                            className="sao-input"
                            value={shippingOrganizationCode}
                            onChange={(e) => setShippingOrganizationCode(e.target.value)}
                        />

                        <label>{t("sao.details.legalName")} *</label>
                        <input
                            className="sao-input"
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                        />

                        <label>{t("sao.details.altName")}</label>
                        <input
                            className="sao-input"
                            value={altName}
                            onChange={(e) => setAltName(e.target.value)}
                        />

                        <label>{t("sao.details.address")}</label>
                        <input
                            className="sao-input"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />

                        <label>{t("sao.details.taxnumber")} *</label>
                        <input
                            className="sao-input"
                            value={taxnumber}
                            onChange={(e) => setTaxnumber(e.target.value)}
                        />

                        <div className="sao-modal-actions">
                            <button
                                className="sao-btn-cancel"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                {t("sao.cancel")}
                            </button>
                            <button
                                className="sao-btn-save"
                                onClick={handleCreate}
                            >
                                {t("sao.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
