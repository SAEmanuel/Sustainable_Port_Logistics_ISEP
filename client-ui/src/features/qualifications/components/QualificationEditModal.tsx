import { useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaEdit, FaTimes } from "react-icons/fa";
import type { Qualification } from "../types/qualification";
import { updateQualification } from "../services/qualificationService";

interface Props {
    qualification: Qualification;
    onClose: () => void;
    onSuccess: (updated: Qualification) => void;
}

type QualificationUpdate = Partial<Pick<Qualification, "code" | "name">>;

export default function QualificationEditModal({ qualification, onClose, onSuccess }: Props) {
    const [editCode, setEditCode] = useState("");
    const [editName, setEditName] = useState("");
    const [updating, setUpdating] = useState(false);

    const { t } = useTranslation();

    const handleSave = async () => {
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

            const updated = await updateQualification(qualification.id, updateData);

            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.updateSuccess"));

            onSuccess(updated);
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <>
            <div className="qual-overlay" onClick={onClose} />

            <div className="qual-edit-modal">
                <div className="qual-edit-header">
                    <h3>
                        <FaEdit /> {t("qualifications.editTitle")}
                    </h3>
                    <button onClick={onClose} className="qual-edit-close">
                        <FaTimes />
                    </button>
                </div>

                <div className="qual-edit-current">
                    <p><strong>{t("qualifications.currentCode")}:</strong> {qualification.code}</p>
                    <p><strong>{t("qualifications.currentName")}:</strong> {qualification.name}</p>
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
                        onClick={onClose}
                        disabled={updating}
                    >
                        {t("qualifications.cancel")}
                    </button>
                    <button
                        className="qual-btn-save"
                        onClick={handleSave}
                        disabled={updating}
                    >
                        {updating ? t("qualifications.saving") : t("qualifications.save")}
                    </button>
                </div>
            </div>
        </>
    );
}