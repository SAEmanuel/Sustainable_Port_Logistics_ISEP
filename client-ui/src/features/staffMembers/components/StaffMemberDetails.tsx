import { useTranslation } from "react-i18next";
import { FaTimes, FaUser, FaPhoneAlt, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import { getWeekDayNames } from "../types/staffMember";

interface Props {
    staffMember: StaffMember;
    onClose: () => void;
    onEdit: () => void;
    onDeactivate: () => void;
}

export default function StaffMemberDetails({ staffMember, onClose, onEdit, onDeactivate }: Props) {
    const { t } = useTranslation();

    // Traduz os dias da semana usando keys i18next weekDay
    const scheduleDays = getWeekDayNames(staffMember.schedule.daysOfWeek).map(day => t(`weekDay.${day}`));

    return (
        <>
            <div className="staffMember-overlay" onClick={onClose}></div>
            <div className="staffMember-slide">
                <button className="staffMember-slide-close" onClick={onClose} aria-label={t("close")}>
                    <FaTimes />
                </button>

                <h3>
                    <FaUser /> {t("staffMembers.detailsTitle")}
                </h3>

                <p><strong>{t("staffMembers.details.name")}:</strong> {staffMember.shortName}</p>
                <p><strong>{t("staffMembers.details.email")}:</strong> <FaEnvelope /> {staffMember.email}</p>
                <p><strong>{t("staffMembers.details.phone")}:</strong> <FaPhoneAlt /> {staffMember.phone}</p>
                <p><strong>{t("staffMembers.details.mecNumber")}:</strong> {staffMember.mecanographicNumber}</p>
                <p>
                    <strong>{t("staffMembers.details.schedule")}:</strong> {t(`shiftType.${staffMember.schedule.shift}`)} -{" "}
                    {scheduleDays.length > 0 ? scheduleDays.join(", ") : t("staffMembers.details.noDays")}
                    <FaCalendarAlt style={{ marginLeft: 6, color: "#667eea" }} />
                </p>

                <div className="staffMember-slide-actions" style={{ marginTop: "2rem" }}>
                    <button
                        className="staffMember-btn-deactivate"
                        onClick={onDeactivate}
                    >
                        {t("staffMembers.deactivate")}
                    </button>
                    <button
                        className="staffMember-btn-edit"
                        onClick={onEdit}
                    >
                        {t("staffMembers.edit")}
                    </button>
                </div>
            </div>
        </>
    );
}
