import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess, notifyError } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaUsers } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import { getStaffMembers } from "../services/staffMemberService";
import StaffMemberTable from "../components/StaffMemberTable";
import StaffMemberDetails from "../components/StaffMemberDetails";
import StaffMemberSearch from "../components/StaffMemberSearch";
import StaffMemberEditModal from "../components/StaffMemberEditModal";
import "../style/staffMember.css";

export default function StaffMember() {
    const [items, setItems] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<StaffMember | null>(null);
    const [editing, setEditing] = useState(false);
    const [searchMode, setSearchMode] = useState<"list" | "mecNumber" | "name" | "status">("list");

    const { t } = useTranslation();

    useEffect(() => {
        if (searchMode === "list") {
            loadStaffMembers();
        }
    }, [t, searchMode]);

    async function loadStaffMembers() {
        notifyLoading(t("staffMembers.loading"));

        try {
            const data = await getStaffMembers();
            setItems(data);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.loadSuccess", { count: data.length }));
        } catch {
            toast.dismiss("loading-global");
            notifyError(t("staffMembers.loadFail"));
        } finally {
            setLoading(false);
        }
    }

    const handleSelectStaff = (staff: StaffMember) => {
        setSelected(staff);
    };

    const handleCloseDetails = () => {
        setSelected(null);
    };

    const handleBackToList = () => {
        setSearchMode("list");
        setSelected(null);
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCloseEditModal = () => {
        setEditing(false);
    };

    const handleUpdate = async () => {
        await loadStaffMembers();
        setSelected(null);
        setEditing(false);
    };

    // ⭐ CALLBACK QUANDO TOGGLE FOR BEM-SUCEDIDO
    const handleToggleSuccess = (updated: StaffMember) => {
        // Atualiza na lista
        setItems(items.map(sm =>
            sm.id === updated.id ? updated : sm
        ));

        // Atualiza o selected
        setSelected(updated);
    };

    return (
        <div className="staffMember-page">
            {/* HEADER */}
            <div className="staffMember-title-area">
                <div className="staffMember-title-box">
                    <h2 className="staffMember-title">
                        <FaUsers className="staffMember-icon" /> {t("staffMembers.title")}
                    </h2>
                    <p className="staffMember-sub">
                        {t("staffMembers.count", { count: items.length })}
                    </p>
                </div>
            </div>

            {/* BUSCA */}
            <StaffMemberSearch
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                onResultSelect={handleSelectStaff}
                onBackToList={handleBackToList}
            />

            {/* TABELA */}
            {searchMode === "list" && (
                <StaffMemberTable
                    items={items}
                    loading={loading}
                    onSelect={handleSelectStaff}
                />
            )}

            {/* DETALHES */}
            {selected && !editing && (
                <StaffMemberDetails
                    staffMember={selected}
                    onClose={handleCloseDetails}
                    onEdit={handleEdit}
                    onToggleSuccess={handleToggleSuccess}
                />
            )}

            {/* MODAL DE EDIÇÃO */}
            {editing && selected && (
                <StaffMemberEditModal
                    staffMember={selected}
                    mode="edit"
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}