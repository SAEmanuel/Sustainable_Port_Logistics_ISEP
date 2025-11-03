import { useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaTimes, FaUser, FaPhoneAlt, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import { getWeekDayNames } from "../types/staffMember";
import { toggleStaffMemberStatus } from "../services/staffMemberService";

interface Props {
    staffMember: StaffMember;
    onClose: () => void;
    onEdit: () => void;
    onToggleSuccess: (updated: StaffMember) => void;
}

export default function StaffMemberDetails({
                                               staffMember,
                                               onClose,
                                               onEdit,
                                               onToggleSuccess
                                           }: Props) {
    const [toggling, setToggling] = useState(false);
    const { t } = useTranslation();

    const scheduleDays = getWeekDayNames(staffMember.schedule.daysOfWeek)
        .map(day => t(`weekDay.${day}`));

    const handleToggle = async () => {
        setToggling(true);
        notifyLoading(
            staffMember.isActive
                ? t("staffMembers.deactivating")
                : t("staffMembers.activating")
        );

        try {
            console.log(staffMember.mecanographicNumber);
            const updated = await toggleStaffMemberStatus(staffMember.mecanographicNumber);

            toast.dismiss("loading-global");
            notifySuccess(
                updated.isActive
                    ? t("staffMembers.activateSuccess")
                    : t("staffMembers.deactivateSuccess")
            );

            onToggleSuccess(updated);
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setToggling(false);
        }
    };

    return (
        <>
            <div className="staffMember-overlay" onClick={onClose}></div>
            <div className="staffMember-slide" data-staff-inactive={!staffMember.isActive}>
                <button
                    className="staffMember-slide-close"
                    onClick={onClose}
                    aria-label={t("close")}
                >
                    <FaTimes />
                </button>

                <h3>
                    <FaUser /> {t("staffMembers.detailsTitle")}
                </h3>

                {/* Badge de Status */}
                <div className="staffMember-status-badge">
                    <span className={staffMember.isActive ? "badge-active" : "badge-inactive"}>
                        {staffMember.isActive
                            ? t("staffMembers.statusActive")
                            : t("staffMembers.statusInactive")}
                    </span>
                </div>

                <p>
                    <strong>{t("staffMembers.details.name")}:</strong> {staffMember.shortName}
                </p>
                <p>
                    <strong>{t("staffMembers.details.email")}:</strong>
                    <FaEnvelope style={{ marginLeft: 6 }} /> {staffMember.email}
                </p>
                <p>
                    <strong>{t("staffMembers.details.phone")}:</strong>
                    <FaPhoneAlt style={{ marginLeft: 6 }} /> {staffMember.phone}
                </p>
                <p>
                    <strong>{t("staffMembers.details.mecNumber")}:</strong> {staffMember.mecanographicNumber}
                </p>
                <p>
                    <strong>{t("staffMembers.details.schedule")}:</strong>
                    {t(`shiftType.${staffMember.schedule.shift}`)} - {" "}
                    {scheduleDays.length > 0 ? scheduleDays.join(", ") : t("staffMembers.details.noDays")}
                    <FaCalendarAlt style={{ marginLeft: 6, color: "#667eea" }} />
                </p>

                {/* Qualifications */}
                {staffMember.qualificationCodes?.length > 0 && (
                    <div className="staffMember-qualifications">
                        <strong>{t("staffMembers.details.qualifications")}:</strong>
                        <div className="qual-badges">
                            {staffMember.qualificationCodes.map(code => (
                                <span key={code} className="qual-badge">{code}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/*  DOIS BOTÕES */}
                <div className="staffMember-slide-actions" style={{ marginTop: "2rem" }}>
                    <button
                        className="staffMember-btn-toggle"
                        onClick={handleToggle}
                        disabled={toggling}
                    >
                        {toggling ? t("staffMembers.toggling") : t("staffMembers.toggle")}
                    </button>
                    <button
                        className="staffMember-btn-edit"
                        onClick={onEdit}
                        disabled={toggling}
                    >
                        {t("staffMembers.edit")}
                    </button>
                </div>
            </div>
        </>
    );
}