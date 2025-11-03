import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaEdit, FaTimes, FaCheckSquare, FaSquare } from "react-icons/fa";
import type { StaffMember, CreateStaffMember, ShiftType, Schedule } from "../types/staffMember";
import { createStaffMember } from "../services/staffMemberService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/types/qualification";
import { ShiftType as ShiftTypes, createSchedule, SHIFT_OPTIONS, WEEKDAY_OPTIONS } from "../types/staffMember";

interface Props {
    onClose: () => void;
    onSuccess: (created: StaffMember) => void;
}

export default function StaffMemberCreateModal({ onClose, onSuccess }: Props) {

    const [shortName, setShortName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");


    const [selectedShift, setSelectedShift] = useState<ShiftType>(ShiftTypes.Morning);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);


    const [availableQualifications, setAvailableQualifications] = useState<Qualification[]>([]);
    const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
    const [loadingQualifications, setLoadingQualifications] = useState(false);

    const [creating, setCreating] = useState(false);
    const { t } = useTranslation();


    useEffect(() => {
        loadQualifications();
    }, []);

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

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const toggleQualification = (code: string) => {
        setSelectedQualifications(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };


    const handleSave = async () => {
        if (!shortName.trim()) {
            notifyError(t("staffMembers.nameRequired"));
            return;
        }
        if (!email.trim()) {
            notifyError(t("staffMembers.emailRequired"));
            return;
        }
        if (!phone.trim()) {
            notifyError(t("staffMembers.phoneRequired"));
            return;
        }
        if (selectedDays.length === 0) {
            notifyError(t("staffMembers.selectAtLeastOneDay"));
            return;
        }

        setCreating(true);
        notifyLoading(t("staffMembers.creating"));

        try {
            const schedule: Schedule = createSchedule(selectedShift, selectedDays);

            const newStaff: CreateStaffMember = {
                shortName: shortName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                schedule: schedule,
                isActive: true,
                qualificationCodes: selectedQualifications.length > 0 ? selectedQualifications : undefined
            };

            const created = await createStaffMember(newStaff);

            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.createSuccess"));

            onSuccess(created);
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="staffMember-overlay" onClick={onClose} />

            <div className="staffMember-create-modal">
                <div className="staffMember-edit-header">
                    <button onClick={onClose} className="staffMember-edit-close">
                        <FaTimes />
                    </button>
                    <h3>
                        <FaEdit /> {t("staffMembers.createTitle")}
                    </h3>
                </div>

                <div className="staffMember-create-content">
                    {/* CAMPOS BÁSICOS */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.basicInfo")}</h4>

                        <div className="staffMember-form-group">
                            <label>{t("staffMembers.form.name")} *</label>
                            <input
                                type="text"
                                placeholder={t("staffMembers.form.namePlaceholder")}
                                value={shortName}
                                onChange={(e) => setShortName(e.target.value)}
                            />
                        </div>

                        <div className="staffMember-form-group">
                            <label>{t("staffMembers.form.email")} *</label>
                            <input
                                type="email"
                                placeholder={t("staffMembers.form.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="staffMember-form-group">
                            <label>{t("staffMembers.form.phone")} *</label>
                            <input
                                type="tel"
                                placeholder={t("staffMembers.form.phonePlaceholder")}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* SCHEDULE */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.scheduleInfo")} *</h4>

                        <div className="staffMember-form-group">
                            <label>{t("staffMembers.form.shift")}</label>
                            <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                                className="staffMember-select"
                            >
                                {SHIFT_OPTIONS.map(shift => (
                                    <option key={shift} value={shift}>
                                        {t(`shiftType.${shift}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="staffMember-form-group">
                            <label>{t("staffMembers.form.workDays")}</label>
                            <div className="staffMember-weekday-grid">
                                {WEEKDAY_OPTIONS.map(({ value, label }) => (
                                    <div
                                        key={value}
                                        className={`staffMember-weekday-item ${selectedDays.includes(value) ? 'selected' : ''}`}
                                        onClick={() => toggleDay(value)}
                                    >
                                        <div className="staffMember-weekday-checkbox">
                                            {selectedDays.includes(value) ? (
                                                <FaCheckSquare />
                                            ) : (
                                                <FaSquare />
                                            )}
                                        </div>
                                        <span>{t(`weekDay.${label}`)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* QUALIFICATIONS */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.qualificationsInfo")}</h4>
                        <p className="staffMember-form-description">
                            {t("staffMembers.qualificationsOptional")}
                        </p>

                        {loadingQualifications ? (
                            <p className="staffMember-loading-small">{t("staffMembers.loadingQualifications")}</p>
                        ) : (
                            <div className="staffMember-qualifications-grid-small">
                                {availableQualifications.map(qual => (
                                    <div
                                        key={qual.id}
                                        className={`staffMember-qual-item ${selectedQualifications.includes(qual.code) ? 'selected' : ''}`}
                                        onClick={() => toggleQualification(qual.code)}
                                    >
                                        <div className="staffMember-qual-checkbox">
                                            {selectedQualifications.includes(qual.code) ? (
                                                <FaCheckSquare />
                                            ) : (
                                                <FaSquare />
                                            )}
                                        </div>
                                        <div className="staffMember-qual-info">
                                            <span className="staffMember-qual-code">{qual.code}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="staffMember-edit-actions">
                    <button
                        className="staffMember-btn-cancel"
                        onClick={onClose}
                        disabled={creating}
                    >
                        {t("staffMembers.cancel")}
                    </button>
                    <button
                        className="staffMember-btn-save"
                        onClick={handleSave}
                        disabled={creating}
                    >
                        {creating ? t("staffMembers.creating") : t("staffMembers.create")}
                    </button>
                </div>
            </div>
        </>
    );
}