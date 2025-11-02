import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import type { Qualification } from "../types/qualification";

interface Props {
    qualification: Qualification;
    onClose: () => void;
    onEdit: () => void;
}

export default function QualificationDetails({ qualification, onClose, onEdit }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <div className="qual-overlay" onClick={onClose} />

            <div className="qual-slide">
                <button className="qual-slide-close" onClick={onClose}>
                    <FaTimes />
                </button>

                <h3>{qualification.code}</h3>

                <p>
                    <strong>{t("qualifications.details.name")}:</strong> {qualification.name}
                </p>

                <div className="qual-slide-actions">
                    <button className="qual-btn-edit" onClick={onEdit}>
                        {t("qualifications.edit")}
                    </button>
                </div>
            </div>
        </>
    );
}