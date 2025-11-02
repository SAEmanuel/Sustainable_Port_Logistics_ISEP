import { useEffect, useState } from "react";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaCertificate, FaTimes, FaSearch, FaEdit } from "react-icons/fa";
import type { Qualification } from "../types/qualification.ts";
import {
    getQualifications,
    getQualificationByCode,
    getQualificationByName,
    updateQualification,
    createQualification
} from "../services/qualificationService.ts";
import "../style/qualificationList.css";

type QualificationUpdate = Partial<Pick<Qualification, "code" | "name">>;

export default function QualificationList() {
    const [items, setItems] = useState<Qualification[]>([]);
    const [selected, setSelected] = useState<Qualification | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchMode, setSearchMode] = useState<"list" | "code" | "name">("list");
    const [searchValue, setSearchValue] = useState("");
    const [searchResult, setSearchResult] = useState<Qualification | null>(null);
    const [searching, setSearching] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [editCode, setEditCode] = useState("");
    const [editName, setEditName] = useState("");
    const [updating, setUpdating] = useState(false);

    // Estados para criação
    const [createMode, setCreateMode] = useState(false);
    const [createCode, setCreateCode] = useState("");
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);

    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        async function load() {
            notifyLoading(t("qualifications.loading"));

            try {
                const data = await getQualifications();
                setItems(data);

                toast.dismiss("loading-global");
                notifySuccess(t("qualifications.loadSuccess", { count: data.length }));
            } catch {
                toast.dismiss("loading-global");
                notifyError(t("qualifications.loadError"));
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [t]);

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
            notifyError(t("qualifications.searchNotFound"));
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleBackToList = () => {
        setSearchMode("list");
        setSearchValue("");
        setSearchResult(null);
    };

    const handleOpenEdit = (qual: Qualification) => {
        setSelected(qual);
        setEditMode(true);
        setEditCode("");
        setEditName("");
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditCode("");
        setEditName("");
    };

    const handleSaveEdit = async () => {
        if (!selected) return;

        if (!editCode.trim() && !editName.trim()) {
            notifyError(t("qualifications.editEmptyError"));
            return;
        }

        setUpdating(true);
        notifyLoading(t("qualifications.updating"));

        try {

            const updateData: QualificationUpdate = {};

            if (editCode.trim()) {
                updateData.code = editCode.trim();
            }

            if (editName.trim()) {
                updateData.name = editName.trim();
            }

            const updated = await updateQualification(selected.id, updateData);

            setItems(items.map(q => q.id === updated.id ? updated : q));

            setSelected(updated);

            if (searchResult && searchResult.id === updated.id) {
                setSearchResult(updated);
            }

            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.updateSuccess"));

            setEditMode(false);
            setEditCode("");
            setEditName("");
        } catch (error: any) {
            toast.dismiss("loading-global");
            notifyError(error?.response?.data?.message || t("qualifications.updateError"));
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelCreate = () => {
        setCreateMode(false);
        setCreateCode("");
        setCreateName("");
    };

    const handleSaveCreate = async () => {
        if (!createName.trim()) {
            notifyError(t("qualifications.createNameRequired"));
            return;
        }

        setCreating(true);
        notifyLoading(t("qualifications.creating"));

        try {
            const newQual = {
                code: createCode.trim() || undefined,
                name: createName.trim()
            };

            const created = await createQualification(newQual);

            setItems([created, ...items]);

            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.createSuccess"));

            setCreateMode(false);
            setCreateCode("");
            setCreateName("");
        } catch (error: any) {
            toast.dismiss("loading-global");
            notifyError(error?.response?.data?.message || t("qualifications.createError"));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="qual-page">
            {selected && <div className="qual-overlay" onClick={() => setSelected(null)} />}

            {editMode && <div className="qual-overlay" onClick={handleCancelEdit} />}
            {createMode && <div className="qual-overlay" onClick={handleCancelCreate} />}

            <div className="qual-title-area">
                <div className="qual-title-box">
                    <h2 className="qual-title">
                        <FaCertificate className="qual-icon" /> {t("qualifications.title")}
                    </h2>
                    <p className="qual-sub">
                        {t("qualifications.count", { count: items.length })}
                    </p>
                </div>

                <button
                    className="qual-create-btn-top"
                    onClick={() => setCreateMode(true)}
                >
                    + {t("qualifications.add")}
                </button>
            </div>

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
                        setSearchMode("code");
                        setSearchResult(null);
                    }}
                >
                    {t("qualifications.searchByCode")}
                </button>
                <button
                    className={searchMode === "name" ? "active" : ""}
                    onClick={() => {
                        setSearchMode("name");
                        setSearchResult(null);
                    }}
                >
                    {t("qualifications.searchByName")}
                </button>
            </div>

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
                                onClick={() => setSelected(searchResult)}
                            >
                                {t("qualifications.viewDetails")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {searchMode === "list" && (
                <>
                    {loading ? (
                        <p className="qual-loading">{t("qualifications.loading")}</p>
                    ) : items.length === 0 ? (
                        <p className="qual-empty">{t("qualifications.empty")}</p>
                    ) : (
                        <div className="qual-table-wrapper">
                            <table className="qual-table">
                                <thead>
                                <tr>
                                    <th>{t("qualifications.details.code")}</th>
                                    <th>{t("qualifications.details.name")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map((q) => (
                                    <tr
                                        key={q.id}
                                        className="qual-row"
                                        onClick={() => setSelected(q)}
                                    >
                                        <td>
                                            <span className="qual-badge">{q.code}</span>
                                        </td>
                                        <td>{q.name}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {selected && (
                <div className="qual-slide">
                    <button
                        className="qual-slide-close"
                        onClick={() => setSelected(null)}
                    >
                        <FaTimes />
                    </button>

                    <h3>{selected.code}</h3>

                    <p>
                        <strong>{t("qualifications.details.name")}:</strong> {selected.name}
                    </p>

                    <div className="qual-slide-actions">
                        <button
                            className="qual-btn-edit"
                            onClick={() => handleOpenEdit(selected)}
                        >
                            {t("qualifications.edit")}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de edição */}
            {editMode && selected && (
                <div className="qual-edit-modal">
                    <div className="qual-edit-header">
                        <h3>
                            <FaEdit /> {t("qualifications.editTitle")}
                        </h3>
                        <button onClick={handleCancelEdit} className="qual-edit-close">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="qual-edit-current">
                        <p><strong>{t("qualifications.currentCode")}:</strong> {selected.code}</p>
                        <p><strong>{t("qualifications.currentName")}:</strong> {selected.name}</p>
                    </div>

                    <div className="qual-edit-form">
                        <div className="qual-form-group">
                            <label>{t("qualifications.newCode")}</label>
                            <input
                                type="text"
                                placeholder={t("qualifications.newCodePlaceholder")}
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value)}
                            />
                            <small>{t("qualifications.editOptional")}</small>
                        </div>

                        <div className="qual-form-group">
                            <label>{t("qualifications.newName")}</label>
                            <input
                                type="text"
                                placeholder={t("qualifications.newNamePlaceholder")}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                            <small>{t("qualifications.editOptional")}</small>
                        </div>
                    </div>

                    <div className="qual-edit-actions">
                        <button
                            className="qual-btn-cancel"
                            onClick={handleCancelEdit}
                            disabled={updating}
                        >
                            {t("qualifications.cancel")}
                        </button>
                        <button
                            className="qual-btn-save"
                            onClick={handleSaveEdit}
                            disabled={updating}
                        >
                            {updating ? t("qualifications.saving") : t("qualifications.save")}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de criação */}
            {createMode && (
                <div className="qual-edit-modal">
                    <div className="qual-edit-header">
                        <h3>
                            <FaEdit /> {t("qualifications.createTitle")}
                        </h3>
                        <button onClick={handleCancelCreate} className="qual-edit-close">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="qual-edit-form">
                        <div className="qual-form-group">
                            <label>{t("qualifications.newCode")}</label>
                            <input
                                type="text"
                                placeholder={t("qualifications.newCodePlaceholder")}
                                value={createCode}
                                onChange={(e) => setCreateCode(e.target.value)}
                            />
                            <small>{t("qualifications.editOptional")}</small>
                        </div>

                        <div className="qual-form-group">
                            <label>{t("qualifications.newName")}</label>
                            <input
                                type="text"
                                placeholder={t("qualifications.newNamePlaceholder")}
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                            />
                            <small>{t("qualifications.editRequired")}</small>
                        </div>
                    </div>

                    <div className="qual-edit-actions">
                        <button
                            className="qual-btn-cancel"
                            onClick={handleCancelCreate}
                            disabled={creating}
                        >
                            {t("qualifications.cancel")}
                        </button>
                        <button
                            className="qual-btn-save"
                            onClick={handleSaveCreate}
                            disabled={creating}
                        >
                            {creating ? t("qualifications.saving") : t("qualifications.create")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
