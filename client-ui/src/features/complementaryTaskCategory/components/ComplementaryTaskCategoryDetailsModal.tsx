import { useTranslation } from "react-i18next";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory";
import "../../complementaryTask/style/complementaryTask.css"

interface Props {
    isOpen: boolean;
    onClose: () => void;
    category: ComplementaryTaskCategory | null;
}

function ComplementaryTaskCategoryDetailsModal({ isOpen, onClose, category }: Props) {
    const { t } = useTranslation();

    if (!isOpen || !category) return null;

    return (
        <div className="ct-modal-overlay">
            <div className="ct-modal-content">
                <h2>{t("ctc.detailsTitle") || "Category Details"}</h2>

                <div className="ct-details-grid">
                    <div className="ct-detail-item">
                        <label>{t("ctc.form.code")}</label>
                        <span>{category.code}</span>
                    </div>

                    <div className="ct-detail-item">
                        <label>{t("ctc.form.name")}</label>
                        <span>{category.name}</span>
                    </div>

                    <div className="ct-detail-item">
                        <label>{t("ctc.form.category")}</label>
                        <span>{t(`ctc.categories.${category.category}`) || category.category}</span>
                    </div>

                    <div className="ct-detail-item">
                        <label>{t("ctc.form.duration")}</label>
                        <span>{category.defaultDuration ? `${category.defaultDuration} min` : "-"}</span>
                    </div>

                    <div className="ct-detail-item full-width">
                        <label>{t("ctc.form.description")}</label>
                        <p>{category.description || "-"}</p>
                    </div>

                    <div className="ct-detail-item">
                        <label>{t("ctc.table.status")}</label>
                        <span className={`status-pill ${category.isActive ? "status-active" : "status-inactive"}`}>
                            {category.isActive ? t("status.active") : t("status.inactive")}
                        </span>
                    </div>
                </div>

                <div className="ct-modal-actions-wizard" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="ct-submit-button">
                        {t("actions.close") || "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComplementaryTaskCategoryDetailsModal;