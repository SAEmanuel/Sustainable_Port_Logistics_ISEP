import { useTranslation } from "react-i18next";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";

import "../../complementaryTaskCategory/style/complementaryTaskCategoryDetails.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    category: ComplementaryTaskCategory | null;
}

function ComplementaryTaskCategoryDetailsModal({ isOpen, onClose, category }: Props) {
    const { t } = useTranslation();

    if (!isOpen || !category) return null;

    return (
        <div className="ctc-details-overlay">
            <div className="ctc-details-content">
                <div className="ctc-details-header">
                    <h2>{t("ctc.detailsTitle") || "Category Details"}</h2>
                    <button className="ctc-close-x" onClick={onClose}>&times;</button>
                </div>

                <div className="ctc-grid">
                    <div className="ctc-item">
                        <label>{t("ctc.form.code")}</label>
                        <span className="ctc-value-code">{category.code}</span>
                    </div>

                    <div className="ctc-item">
                        <label>{t("ctc.form.name")}</label>
                        <span>{category.name}</span>
                    </div>

                    <div className="ctc-item">
                        <label>{t("ctc.form.category")}</label>
                        <span>{t(`ctc.categories.${category.category}`) || category.category}</span>
                    </div>

                    <div className="ctc-item">
                        <label>{t("ctc.form.duration")}</label>
                        <span className="ctc-duration-badge">
                            {category.defaultDuration ? `${category.defaultDuration} min` : "-"}
                        </span>
                    </div>

                    <div className="ctc-item full-width">
                        <label>{t("ctc.form.description")}</label>
                        <p className="ctc-description-text">{category.description || "-"}</p>
                    </div>

                    <div className="ctc-item">
                        <label>{t("ctc.table.status")}</label>
                        <span className={`ctc-status-pill ${category.isActive ? "active" : "inactive"}`}>
                            {category.isActive ? t("status.active") : t("status.inactive")}
                        </span>
                    </div>
                </div>

                <div className="ctc-footer">
                    <button onClick={onClose} className="ctc-close-button">
                        {t("actions.close") || "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComplementaryTaskCategoryDetailsModal;