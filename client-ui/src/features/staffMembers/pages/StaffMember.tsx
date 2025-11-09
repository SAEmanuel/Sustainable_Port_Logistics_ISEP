import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess, notifyError } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaUsers } from "react-icons/fa";
import { Link } from "react-router-dom";
import type { StaffMember } from "../types/staffMember";
import { getStaffMembers } from "../services/staffMemberService";
import StaffMemberTable from "../components/StaffMemberTable";
import StaffMemberDetails from "../components/StaffMemberDetails";
import StaffMemberSearch from "../components/StaffMemberSearch";
import StaffMemberEditModal from "../components/StaffMemberEditModal";
import StaffMemberCreateModal from "../components/StaffMemberCreateModal";
import "../style/staffMember.css";

export default function StaffMember() {
    const [items, setItems] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<StaffMember | null>(null);
    const [editing, setEditing] = useState(false);
    const [searchMode, setSearchMode] = useState<"list" | "mecNumber" | "name" | "status" | "qualifications">("list");
    const [createMode, setCreateMode] = useState(false);

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

    const handleToggleSuccess = (updated: StaffMember) => {
        setItems(items.map(sm => (sm.id === updated.id ? updated : sm)));
        setSelected(updated);
    };

    const handleCreateSuccess = (created: StaffMember) => {
        setItems([created, ...items]);
        setCreateMode(false);
    };

    return (
        <div className="staffMember-page">
            <div className="staffMember-title-area">
                <div className="staffMember-header-left">
                    <Link
                        to="/dashboard"
                        className="pr-back-button"
                        title={t("physicalResource.actions.backToDashboard")}
                    >
                        ‹
                    </Link>

                    <div className="staffMember-title-box">
                        <h2 className="staffMember-title">
                            <FaUsers className="staffMember-icon" /> {t("staffMembers.title")}
                        </h2>
                        <p className="staffMember-sub">
                            {t("staffMembers.count", { count: items.length })}
                        </p>
                    </div>
                </div>

                <div className="container-do-botao">
                    <button
                        className="staff-create-btn-top"
                        onClick={() => setCreateMode(true)}
                    >
                        + {t("staffMembers.add")}
                    </button>
                </div>
            </div>

            <StaffMemberSearch
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                onResultSelect={handleSelectStaff}
                onBackToList={handleBackToList}
            />

            {searchMode === "list" && (
                <StaffMemberTable
                    items={items}
                    loading={loading}
                    onSelect={handleSelectStaff}
                />
            )}

            {selected && !editing && (
                <StaffMemberDetails
                    staffMember={selected}
                    onClose={handleCloseDetails}
                    onEdit={handleEdit}
                    onToggleSuccess={handleToggleSuccess}
                />
            )}

            {editing && selected && (
                <StaffMemberEditModal
                    staffMember={selected}
                    mode="edit"
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdate}
                />
            )}

            {createMode && (
                <StaffMemberCreateModal
                    onClose={() => setCreateMode(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}