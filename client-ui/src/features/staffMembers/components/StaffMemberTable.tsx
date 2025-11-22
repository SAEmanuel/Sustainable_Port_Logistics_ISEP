import { useTranslation } from "react-i18next";
import type { StaffMember } from "../domain/staffMember"; 

interface Props {
    items: StaffMember[];
    loading: boolean;
    onSelect: (staff: StaffMember) => void;
}

export default function StaffMemberTable({ items, loading, onSelect }: Props) {
    const { t } = useTranslation();

    if (loading) {
        return <p className="staffMember-loading">{t("staffMembers.loading")}</p>;
    }

    if (items.length === 0) {
        return <p className="staffMember-empty">{t("staffMembers.empty")}</p>;
    }

    return (
        <div className="staffMember-table-wrapper">
            <table className="staffMember-table">
                <thead>
                <tr>
                    <th>{t("staffMembers.details.mecNumber")}</th>
                    <th>{t("staffMembers.details.email")}</th>
                    <th>{t("staffMembers.details.name")}</th>
                </tr>
                </thead>
                <tbody>
                {items.map((staff) => (
                    <tr
                        key={staff.id}
                        className="staffMember-row"
                        onClick={() => onSelect(staff)}
                    >
                        <td><span className="staffMember-badge">{staff.mecanographicNumber}</span></td>
                        <td>{staff.email}</td>
                        <td>{staff.shortName}</td>
                    </tr>
                ))}
                </tbody>
            </table>

        </div>
    );
}
