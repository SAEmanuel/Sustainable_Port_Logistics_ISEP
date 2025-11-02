import { useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaEdit, FaTimes } from "react-icons/fa";
import type { Qualification } from "../types/qualification";
import { createQualification } from "../services/qualificationService";

interface Props {
    onClose: () => void;
    onSuccess: (created: Qualification) => void;
}

export default function QualificationCreateModal({ onClose, onSuccess }: Props) {
    const [createCode, setCreateCode] = useState("");
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);

    const { t } = useTranslation();

    const handleSave = async () => {
        if (!createCode.trim() && !createName.trim()) {
            notifyError(t("qualifications.createEmptyError"));
            return;
        }

        setCreating(true);
        notifyLoading(t("qualifications.creating"));

        try {
            const newQual: any = {};

            if (createCode.trim()) {
                newQual.code = createCode.trim();
            }

            if (createName.trim()) {
                newQual.name = createName.trim();
            }

            const created = await createQualification(newQual);

            toast.dismiss("loading-global");
            notifySuccess(t("qualifications.createSuccess"));

            onSuccess(created);
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="qual-overlay" onClick={onClose} />

            <div className="qual-edit-modal">
                <div className="qual-edit-header">
                    <h3>
                        <FaEdit /> {t("qualifications.createTitle")}
                    </h3>
                    <button onClick={onClose} className="qual-edit-close">
                        <FaTimes />
                    </button>
                </div>

                <div className="qual-edit-form">
                    <div className="qual-form-group">
                        <label>{t("qualifications.form.code")}</label>
                        <input
                            type="text"
                            placeholder={t("qualifications.form.codePlaceholder")}
                            value={createCode}
                            onChange={(e) => setCreateCode(e.target.value)}
                        />
                        <small>{t("qualifications.editOptional")}</small>
                    </div>

                    <div className="qual-form-group">
                        <label>{t("qualifications.form.name")}</label>
                        <input
                            type="text"
                            placeholder={t("qualifications.form.namePlaceholder")}
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                        />
                        <small>{t("qualifications.editOptional")}</small>
                    </div>
                </div>

                <div className="qual-edit-actions">
                    <button
                        className="qual-btn-cancel"
                        onClick={onClose}
                        disabled={creating}
                    >
                        {t("qualifications.cancel")}
                    </button>
                    <button
                        className="qual-btn-save"
                        onClick={handleSave}
                        disabled={creating}
                    >
                        {creating ? t("qualifications.saving") : t("qualifications.create")}
                    </button>
                </div>
            </div>
        </>
    );
}