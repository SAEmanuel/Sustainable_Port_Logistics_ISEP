import { useTranslation } from "react-i18next";
import type { IncidentType } from "../domain/incidentType";
import "../style/incidentType.css";

interface Props {
    items: IncidentType[];
    onEdit: (it: IncidentType) => void;
}

function IncidentTypeTable({ items, onEdit }: Props) {
    const { t } = useTranslation();

    if (items.length === 0) return <p>{t("incidentType.noData")}</p>;

    return (
        <table className="it-table">
            <thead>
            <tr>
                <th>{t("incidentType.table.code")}</th>
                <th>{t("incidentType.table.name")}</th>
                <th>{t("incidentType.table.severity")}</th>
                <th>{t("incidentType.table.parent")}</th>
                <th>{t("incidentType.table.actions")}</th>
            </tr>
            </thead>

            <tbody>
            {items.map((it) => (
                <tr key={it.id}>
                    <td>{it.code}</td>
                    <td>{it.name}</td>
                    <td>
              <span className={`severity-pill severity-${it.severity.toLowerCase()}`}>
                {t(`incidentType.severity.${it.severity}`)}
              </span>
                    </td>
                    <td>{it.parentCode ?? "-"}</td>
                    <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => onEdit(it)} className="pr-edit-button">
                                {t("incidentType.actions.edit")}
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default IncidentTypeTable;
