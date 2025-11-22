import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaEdit, FaTimes, FaCheckSquare, FaSquare } from "react-icons/fa";
import type { StaffMember } from "../domain/staffMember"; 
import type { UpdateStaffMemberRequest as UpdateStaffMember, ShiftType } from "../dtos/staffMember";
import { updateStaffMember } from "../services/staffMemberService";
import { getQualifications } from "../../qualifications/services/qualificationService";
import type { Qualification } from "../../qualifications/domain/qualification";
import {
    createSchedule,
    SHIFT_OPTIONS,
    WEEKDAY_OPTIONS,
    binaryToWeekDays,
    getWeekDayNames
} from "../helpers/staffMemberHelpers"; 

interface Props {
    staffMember: StaffMember;
    mode: "edit" | "toggle";
    onClose: () => void;
    onUpdate: () => void;
}

export default function StaffMemberEditModal({ staffMember, mode, onClose, onUpdate }: Props) {

    const [shortName, setShortName] = useState(staffMember.shortName);
    const [email, setEmail] = useState(staffMember.email);
    const [phone, setPhone] = useState(staffMember.phone);
    const [isActive, setIsActive] = useState(staffMember.isActive);


    const [wantsToChangeSchedule, setWantsToChangeSchedule] = useState(false);
    const [selectedShift, setSelectedShift] = useState<ShiftType>(staffMember.schedule.shift);
    const [selectedDays, setSelectedDays] = useState<number[]>(
        binaryToWeekDays(staffMember.schedule.daysOfWeek)
    );

    // QUALIFICATIONS
    const [availableQualifications, setAvailableQualifications] = useState<Qualification[]>([]);
    const [selectedQualifications, setSelectedQualifications] = useState<string[]>(
        staffMember.qualificationCodes || []
    );
    const [wantsToAddQualifications, setWantsToAddQualifications] = useState(false);
    const [wantsToChangeQualifications, setWantsToChangeQualifications] = useState(false);
    const [loadingQualifications, setLoadingQualifications] = useState(false);

    const [updating, setUpdating] = useState(false);
    const { t } = useTranslation();

    // CARREGAR QUALIFICATIONS
    useEffect(() => {
        if (wantsToAddQualifications || wantsToChangeQualifications) {
            loadQualifications();
        }
    }, [wantsToAddQualifications, wantsToChangeQualifications]);

    const loadQualifications = async () => {
        setLoadingQualifications(true);
        try {
            const data = await getQualifications();
            setAvailableQualifications(data);

            if (wantsToAddQualifications) {
                setSelectedQualifications([]);
            }
        } catch {
            notifyError(t("staffMembers.loadQualificationsFail"));
        } finally {
            setLoadingQualifications(false);
        }
    };

    // RESET QUANDO MUDAR MODO DE QUALIFICATIONS
    useEffect(() => {
        if (wantsToAddQualifications) {
            setWantsToChangeQualifications(false);
            setSelectedQualifications([]);
        }
    }, [wantsToAddQualifications]);

    useEffect(() => {
        if (wantsToChangeQualifications) {
            setWantsToAddQualifications(false);
            setSelectedQualifications(staffMember.qualificationCodes || []);
        }
    }, [wantsToChangeQualifications]);

    // TOGGLE DAY
    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    // TOGGLE QUALIFICATION
    const toggleQualification = (code: string) => {
        setSelectedQualifications(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    // FILTRAR QUALIFICATIONS (se for adicionar, mostrar só as que não tem)
    const getDisplayedQualifications = () => {
        if (wantsToAddQualifications) {
            const currentCodes = staffMember.qualificationCodes || [];
            return availableQualifications.filter(q => !currentCodes.includes(q.code));
        }
        return availableQualifications;
    };

    const getCurrentScheduleDisplay = () => {
        const days = getWeekDayNames(staffMember.schedule.daysOfWeek);
        const daysTranslated = days.map(day => t(`weekDay.${day}`)).join(", ");
        return `${t(`shiftType.${staffMember.schedule.shift}`)} - ${daysTranslated}`;
    };

    // SAVE
    const handleSave = async () => {
        // VALIDAÇÕES
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
        if (wantsToChangeSchedule && selectedDays.length === 0) {
            notifyError(t("staffMembers.selectAtLeastOneDay"));
            return;
        }

        setUpdating(true);
        notifyLoading(t("staffMembers.updating"));

        try {
            const updates: UpdateStaffMember = {
                mecNumber: staffMember.mecanographicNumber,
                shortName: shortName.trim() !== staffMember.shortName ? shortName.trim() : undefined,
                email: email.trim() !== staffMember.email ? email.trim() : undefined,
                phone: phone.trim() !== staffMember.phone ? phone.trim() : undefined,
                isActive: isActive !== staffMember.isActive ? isActive : undefined,
            };

            if (wantsToChangeSchedule) {
                updates.schedule = createSchedule(selectedShift, selectedDays);
            }

            if (wantsToAddQualifications && selectedQualifications.length > 0) {
                updates.qualificationCodes = selectedQualifications;
                updates.addQualifications = true;
            } else if (wantsToChangeQualifications) {
                updates.qualificationCodes = selectedQualifications;
                updates.addQualifications = false;
            }

            await updateStaffMember(updates);

            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.updateSuccess"));

            onUpdate();
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setUpdating(false);
        }
    };

    if (mode === "toggle") {
        return null;
    }

    return (
        <>
            <div className="staffMember-overlay" onClick={onClose} />

            <div className="staffMember-create-modal">
                <div className="staffMember-edit-header">
                    <button onClick={onClose} className="staffMember-edit-close">
                        <FaTimes />
                    </button>
                    <h3>
                        <FaEdit /> {t("staffMembers.editTitle")}
                    </h3>
                </div>

                <div className="staffMember-create-content">
                    {/* INFO DO STAFF MEMBER */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.currentInfo")}</h4>
                        <p className="staffMember-info-text">
                            <strong>{t("staffMembers.details.mecNumber")}:</strong> {staffMember.mecanographicNumber}
                        </p>
                    </div>

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

                        <div className="staffMember-form-group">
                            <label className="staffMember-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                {t("staffMembers.form.isActive")}
                            </label>
                        </div>
                    </div>

                    {/* SCHEDULE */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.scheduleInfo")}</h4>

                        <div className="staffMember-form-group">
                            <label className="staffMember-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={wantsToChangeSchedule}
                                    onChange={(e) => setWantsToChangeSchedule(e.target.checked)}
                                />
                                {t("staffMembers.form.changeSchedule")}
                            </label>
                        </div>

                        {!wantsToChangeSchedule && (
                            <div className="staffMember-info-box">
                                <p>
                                    <strong>{t("staffMembers.form.currentSchedule")}:</strong>{" "}
                                    {getCurrentScheduleDisplay()}
                                </p>
                            </div>
                        )}

                        {wantsToChangeSchedule && (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* QUALIFICATIONS */}
                    <div className="staffMember-form-section">
                        <h4>{t("staffMembers.qualificationsInfo")}</h4>

                        <div className="staffMember-form-group">
                            <label className="staffMember-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={wantsToAddQualifications}
                                    onChange={(e) => setWantsToAddQualifications(e.target.checked)}
                                />
                                {t("staffMembers.form.addQualifications")}
                            </label>
                        </div>

                        <div className="staffMember-form-group">
                            <label className="staffMember-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={wantsToChangeQualifications}
                                    onChange={(e) => setWantsToChangeQualifications(e.target.checked)}
                                />
                                {t("staffMembers.form.changeQualifications")}
                            </label>
                        </div>

                        {!wantsToAddQualifications && !wantsToChangeQualifications && (
                            <div className="staffMember-info-box">
                                <p>
                                    <strong>{t("staffMembers.form.currentQualifications")}:</strong>{" "}
                                    {staffMember.qualificationCodes && staffMember.qualificationCodes.length > 0
                                        ? staffMember.qualificationCodes.join(", ")
                                        : t("staffMembers.form.noQualifications")}
                                </p>
                            </div>
                        )}

                        {(wantsToAddQualifications || wantsToChangeQualifications) && (
                            <>
                                {loadingQualifications ? (
                                    <p className="staffMember-loading-small">{t("staffMembers.loadingQualifications")}</p>
                                ) : (
                                    <>
                                        {wantsToAddQualifications && (
                                            <p className="staffMember-form-description">
                                                {t("staffMembers.form.addQualificationsDescription")}
                                            </p>
                                        )}
                                        {wantsToChangeQualifications && (
                                            <p className="staffMember-form-description">
                                                {t("staffMembers.form.changeQualificationsDescription")}
                                            </p>
                                        )}

                                        <div className="staffMember-qualifications-grid-small">
                                            {getDisplayedQualifications().map(qual => (
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

                                        {getDisplayedQualifications().length === 0 && wantsToAddQualifications && (
                                            <p className="staffMember-empty-small">
                                                {t("staffMembers.form.alreadyHasAllQualifications")}
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="staffMember-edit-actions">
                    <button
                        className="staffMember-btn-cancel"
                        onClick={onClose}
                        disabled={updating}
                    >
                        {t("staffMembers.cancel")}
                    </button>
                    <button
                        className="staffMember-btn-save"
                        onClick={handleSave}
                        disabled={updating}
                    >
                        {updating ? t("staffMembers.updating") : t("staffMembers.save")}
                    </button>
                </div>
            </div>
        </>
    );
}