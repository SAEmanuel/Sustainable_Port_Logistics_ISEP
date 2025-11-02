import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyLoading, notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";
import { FaUsers } from "react-icons/fa";
import type { StaffMember } from "../types/staffMember";
import { getStaffMembers } from "../services/staffMemberService";
import StaffMemberTable from "../components/StaffMemberTable";
import StaffMemberDetails from "../components/StaffMemberDetails";
import "../style/staffMember.css";

export default function StaffMember() {
    const [items, setItems] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<StaffMember | null>(null);

    const { t } = useTranslation();

    useEffect(() => {
        loadStaffMembers();
    }, [t]);

    async function loadStaffMembers() {
        notifyLoading(t("staffMembers.loading"));

        try {
            const data = await getStaffMembers();
            setItems(data);
            toast.dismiss("loading-global");
            notifySuccess(t("staffMembers.loadSuccess", { count: data.length }));
        } catch {
            toast.dismiss("loading-global");
        } finally {
            setLoading(false);
        }
    }

    const handleSelectStaff = (staff: StaffMember) => {
        setSelected(staff);
    };

    const handleCloseDetails = () => {
        setSelected(null);
    };

    return (
        <div className="staffMember-page">
            {/* HEADER */}
            <div className="staffMember-title-area">
                <div className="staffMember-title-box">
                    <h2 className="staffMember-title">
                        <FaUsers className="staffMember-icon" /> {t("staffMembers.title")}
                    </h2>
                    <p className="staffMember-sub">
                        {t("staffMembers.count", { count: items.length })}
                    </p>
                </div>
            </div>

            {/* TABELA */}
            <StaffMemberTable
                items={items}
                loading={loading}
                onSelect={handleSelectStaff}
            />

            {/* DETALHES */}
            {selected && (
                <StaffMemberDetails
                    staffMember={selected}
                    onClose={handleCloseDetails}
                    onEdit={() => console.log("Editar:", selected)}
                />
            )}
        </div>
    );
}
