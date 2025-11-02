import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaCertificate } from "react-icons/fa";
import type { Qualification } from "../types/qualification";
import { getQualifications } from "../services/qualificationService";
import QualificationTable from "../components/QualificationTable";
import QualificationSearch from "../components/QualificationSearch";
import QualificationDetails from "../components/QualificationDetails";
import QualificationEditModal from "../components/QualificationEditModal";
import QualificationCreateModal from "../components/QualificationCreateModal";
import "../style/qualificationList.css";

export default function Qualification() {
    const [items, setItems] = useState<Qualification[]>([]);
    const [selected, setSelected] = useState<Qualification | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchMode, setSearchMode] = useState<"list" | "code" | "name">("list");

    const [editMode, setEditMode] = useState(false);
    const [createMode, setCreateMode] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        loadQualifications();
    }, [t]);

    async function loadQualifications() {
        notifyLoading(t("qualifications.loading"));

        try {
            const data = await getQualifications();
            setItems(data);
            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.loadSuccess", { count: data.length }));
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setLoading(false);
        }
    }

    const handleSelectQualification = (qual: Qualification) => {
        setSelected(qual);
    };

    const handleEditSuccess = (updated: Qualification) => {
        setItems(items.map(q => q.id === updated.id ? updated : q));
        setSelected(updated);
        setEditMode(false);
    };

    const handleCreateSuccess = (created: Qualification) => {
        setItems([created, ...items]);
        setCreateMode(false);
    };

    const handleBackToList = () => {
        setSearchMode("list");
    };

    return (
        <div className="qual-page">
            {/* HEADER */}
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

            {/* BUSCA */}
            <QualificationSearch
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                onResultSelect={handleSelectQualification}
                onBackToList={handleBackToList}
            />

            {/* TABELA */}
            {searchMode === "list" && (
                <QualificationTable
                    items={items}
                    loading={loading}
                    onSelect={handleSelectQualification}
                />
            )}

            {/* DETALHES */}
            {selected && (
                <QualificationDetails
                    qualification={selected}
                    onClose={() => setSelected(null)}
                    onEdit={() => setEditMode(true)}
                />
            )}

            {/* MODAL DE EDIÇÃO */}
            {editMode && selected && (
                <QualificationEditModal
                    qualification={selected}
                    onClose={() => setEditMode(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* MODAL DE CRIAÇÃO */}
            {createMode && (
                <QualificationCreateModal
                    onClose={() => setCreateMode(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}