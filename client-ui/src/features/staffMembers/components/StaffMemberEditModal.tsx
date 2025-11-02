import { useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaEdit, FaTimes, FaToggleOn, FaToggleOff } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import { toggleStaffMemberStatus } from "../services/staffMemberService";

interface Props {
    staffMember: StaffMember;
    mode: "toggle" | "edit";  // ⭐ Modo do modal
    onClose: () => void;
    onUpdate: () => void;
}

export default function StaffMemberEditModal({
                                                 staffMember,
                                                 mode,
                                                 onClose,
                                                 onUpdate
                                             }: Props) {
    const [processing, setProcessing] = useState(false);
    const { t } = useTranslation();

    // ⭐ TOGGLE
    const handleToggle = async () => {
        setProcessing(true);
        notifyLoading(
            staffMember.isActive
                ? t("staffMembers.deactivating")
                : t("staffMembers.activating")
        );

        try {
            await toggleStaffMemberStatus(staffMember.mecanographicNumber);

            toast.dismiss("loading-global");
            notifySuccess(
                staffMember.isActive
                    ? t("staffMembers.deactivateSuccess")
                    : t("staffMembers.activateSuccess")
            );

            onUpdate();
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setProcessing(false);
        }
    };

    // ⭐ EDIT (implementar depois)


    return (
        <>
            <div className="staffMember-overlay" onClick={onClose} />

            <div className="staffMember-edit-modal">
                <div className="staffMember-edit-header">
                    <h3>
                        <FaEdit /> {mode === "toggle" ? t("staffMembers.toggleTitle") : t("staffMembers.editTitle")}
                    </h3>
                    <button onClick={onClose} className="staffMember-edit-close">
                        <FaTimes />
                    </button>
                </div>

                <div className="staffMember-edit-current">
                    <p><strong>{t("staffMembers.details.name")}:</strong> {staffMember.shortName}</p>
                    <p><strong>{t("staffMembers.details.mecNumber")}:</strong> {staffMember.mecanographicNumber}</p>
                    <p>
                        <strong>{t("staffMembers.details.status")}:</strong>{" "}
                        <span className={staffMember.isActive ? "status-active" : "status-inactive"}>
                            {staffMember.isActive
                                ? t("staffMembers.statusActive")
                                : t("staffMembers.statusInactive")}
                        </span>
                    </p>
                </div>

                {/* ⭐ MODO TOGGLE */}
                {mode === "toggle" && (
                    <div className="staffMember-edit-section">
                        <h4>{t("staffMembers.changeStatus")}</h4>
                        <p className="staffMember-edit-description">
                            {staffMember.isActive
                                ? t("staffMembers.deactivateDescription")
                                : t("staffMembers.activateDescription")}
                        </p>

                        <button
                            className={`staffMember-btn-toggle-action ${staffMember.isActive ? 'deactivate' : 'activate'}`}
                            onClick={handleToggle}
                            disabled={processing}
                        >
                            {staffMember.isActive ? <FaToggleOff /> : <FaToggleOn />}
                            {processing
                                ? t("staffMembers.toggling")
                                : staffMember.isActive
                                    ? t("staffMembers.deactivate")
                                    : t("staffMembers.activate")
                            }
                        </button>
                    </div>
                )}

                {/* ⭐ MODO EDIT (implementar depois) */}
                {mode === "edit" && (
                    <div className="staffMember-edit-section">
                        <h4>{t("staffMembers.editFields")}</h4>
                        <p className="staffMember-edit-description">
                            {t("staffMembers.editDescription")}
                        </p>
                        {/* TODO: Formulário de edição */}
                    </div>
                )}

                <div className="staffMember-edit-actions">
                    <button
                        className="staffMember-btn-cancel"
                        onClick={onClose}
                        disabled={processing}
                    >
                        {t("staffMembers.close")}
                    </button>
                </div>
            </div>
        </>
    );
}