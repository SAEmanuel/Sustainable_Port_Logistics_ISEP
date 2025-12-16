import { useTranslation } from "react-i18next";
import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";
import "../style/complementaryTaskCategory.css";

interface Props {
    categories: ComplementaryTaskCategory[];
    onEdit: (cat: ComplementaryTaskCategory) => void;
    onToggleStatus: (cat: ComplementaryTaskCategory) => void;
}

function ComplementaryTaskCategoryTable({ categories, onEdit, onToggleStatus }: Props) {
    const { t } = useTranslation();

    if (categories.length === 0) {
        return <p>{t("ctc.noData")}</p>;
    }

    return (
        <table className="ctc-table">
            <thead>
            <tr>
                <th>{t("ctc.table.code")}</th>
                <th>{t("ctc.table.name")}</th>
                <th>{t("ctc.table.description")}</th>
                <th>{t("ctc.table.category")}</th>
                <th>{t("ctc.table.duration")}</th>
                <th>{t("ctc.table.status")}</th>
                <th>{t("ctc.table.actions")}</th>
            </tr>
            </thead>
            <tbody>
            {categories.map((cat) => (
                <tr key={cat.id}>
                    <td>{cat.code}</td>
                    <td>{cat.name}</td>
                    <td>{cat.description}</td>
                    <td>{t(`ctc.categories.${cat.category}`)}</td>
                    <td>{cat.defaultDuration ? `${cat.defaultDuration} min` : "-"}</td>
                    <td>
                        <span className={`status-pill ${cat.isActive ? "status-active" : "status-inactive"}`}>
                            {cat.isActive ? t("status.active") : t("status.inactive")}
                        </span>
                    </td>
                    <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => onEdit(cat)} className="pr-edit-button">
                                {t("ctc.actions.edit")}
                            </button>
                            <button
                                onClick={() => onToggleStatus(cat)}
                                className={cat.isActive ? "pr-deactivate-button" : "pr-activate-button"}
                            >
                                {cat.isActive ? t("actions.deactivate") : t("actions.activate")}
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default ComplementaryTaskCategoryTable;