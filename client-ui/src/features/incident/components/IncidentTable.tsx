import { useTranslation } from "react-i18next";
import type { Incident } from "../domain/incident";
import "../style/incidents.css";

export default function IncidentTable({
                                          items,
                                          selectedCode,
                                          onSelect,
                                          onEdit,
                                      }: {
    items: Incident[];
    selectedCode: string | null;
    onSelect: (it: Incident) => void;
    onEdit: (it: Incident) => void;
}) {
    const { t } = useTranslation();

    if (items.length === 0) return <p className="in-muted">{t("incident.noData")}</p>;

    return (
        <table className="in-table">
            <thead>
            <tr>
                <th>{t("incident.table.code")}</th>
                <th>{t("incident.table.type")}</th>
                <th>{t("incident.table.severity")}</th>
                <th>{t("incident.table.impactMode")}</th>
                <th>{t("incident.table.status")}</th>
                <th>{t("incident.table.start")}</th>
                <th>{t("incident.table.end")}</th>
                <th>{t("incident.table.actions")}</th>
            </tr>
            </thead>

            <tbody>
            {items.map((it) => {
                const selected = selectedCode === it.code;
                const status = it.endTime ? "resolved" : "active";

                return (
                    <tr
                        key={it.code}
                        className={selected ? "in-row-selected" : ""}
                        onClick={() => onSelect(it)}
                        role="button"
                        tabIndex={0}
                    >
                        <td className="in-mono">{it.code}</td>
                        <td className="in-mono">{it.incidentTypeCode}</td>

                        <td>
                <span className={`in-pill in-pill-${it.severity.toLowerCase()}`}>
                  {t(`incident.severity.${it.severity}`)}
                </span>
                        </td>

                        <td>
                            <span className="in-pill in-pill-neutral">{t(`incident.impact.${it.impactMode}`)}</span>
                        </td>

                        <td>
                <span className={`in-pill ${status === "active" ? "in-pill-live" : "in-pill-done"}`}>
                  {status === "active" ? t("incident.status.active") : t("incident.status.resolved")}
                </span>
                        </td>

                        <td>{new Date(it.startTime).toLocaleString()}</td>
                        <td>{it.endTime ? new Date(it.endTime).toLocaleString() : "-"}</td>

                        <td onClick={(e) => e.stopPropagation()}>
                            <button className="in-btn in-btn-ghost" onClick={() => onEdit(it)}>
                                {t("actions.edit")}
                            </button>
                        </td>
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
}
