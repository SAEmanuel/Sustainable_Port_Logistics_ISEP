import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCertificate, FaCogs, FaUsers } from "react-icons/fa";
import "./css/logisticsOperatorDashboard.css";

export default function LogisticsOperatorDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const cards = [
        {
            icon: <FaCogs size={60} />,
            title: t("dashboard.physicalResources"),
            description: t("dashboard.physicalResourcesDesc"),
            color: "#f3722c",
            path: "/physical-resources",
        },
        {
            icon: <FaCertificate size={60} />,
            title: t("dashboard.qualifications"),
            description: t("dashboard.qualificationsDesc"),
            color: "#4361ee",
            path: "/qualifications",
        },
        {
            icon: <FaUsers size={60} />,
            title: t("dashboard.staffMembers"),
            description: t("dashboard.staffMembersDesc"),
            color: "#2a9d8f",
            path: "/staff-members",
        },
    ];

    return (
        <div className="lo-dashboard">
            <div className="lo-header">
                <h1>{t("dashboard.welcome")}</h1>
                <p>{t("dashboard.subtitle")}</p>
            </div>

            <div className="lo-cards-grid">
                {cards.map((card) => (
                    <div
                        key={card.path}
                        className="lo-card"
                        onClick={() => navigate(card.path)}
                        style={{ "--card-color": card.color } as React.CSSProperties}
                    >
                        <div className="lo-card-icon" style={{ color: card.color }}>
                            {card.icon}
                        </div>
                        <h2 className="lo-card-title">{card.title}</h2>
                        <p className="lo-card-description">{card.description}</p>
                        <div className="lo-card-arrow">→</div>
                    </div>
                ))}
            </div>
        </div>
    );
}