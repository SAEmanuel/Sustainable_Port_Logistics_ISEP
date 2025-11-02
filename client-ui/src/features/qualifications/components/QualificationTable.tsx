import { useTranslation } from "react-i18next";
import type { Qualification } from "../types/qualification";

interface Props {
    items: Qualification[];
    loading: boolean;
    onSelect: (qual: Qualification) => void;
}

export default function QualificationTable({ items, loading, onSelect }: Props) {
    const { t } = useTranslation();

    if (loading) {
        return <p className="qual-loading">{t("qualifications.loading")}</p>;
    }

    if (items.length === 0) {
        return <p className="qual-empty">{t("qualifications.empty")}</p>;
    }

    return (
        <div className="qual-table-wrapper">
            <table className="qual-table">
                <thead>
                <tr>
                    <th>{t("qualifications.details.code")}</th>
                    <th>{t("qualifications.details.name")}</th>
                </tr>
                </thead>
                <tbody>
                {items.map((q) => (
                    <tr
                        key={q.id}
                        className="qual-row"
                        onClick={() => onSelect(q)}
                    >
                        <td>
                            <span className="qual-badge">{q.code}</span>
                        </td>
                        <td>{q.name}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}