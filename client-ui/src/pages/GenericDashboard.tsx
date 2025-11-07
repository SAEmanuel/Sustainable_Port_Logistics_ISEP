import { JSX, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { Roles, type Role } from "../app/types";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import {
    FaUsers,
    FaCogs,
    FaCertificate,
    FaUniversity,
    FaShip,
    FaProjectDiagram,
    FaRoute,
} from "react-icons/fa";
import "./css/genericDashboard.css";

type LinkItem = { label: string; path: string; color: string; icon: JSX.Element };

const roleColor: Record<Role, string> = {
    [Roles.Administrator]: "#e63946",
    [Roles.LogisticsOperator]: "#4361ee",
    [Roles.ShippingAgentRepresentative]: "#f3722c",
    [Roles.PortAuthorityOfficer]: "#2a9d8f",
    [Roles.ProjectManager]: "#9b59b6",
};

const routeIcon: Record<string, JSX.Element> = {
    "/vvn": <FaUniversity size={44} />,
    "/qualifications": <FaCertificate size={44} />,
    "/staff-members": <FaUsers size={44} />,
    "/physical-resources": <FaCogs size={44} />,
    "/vessels": <FaShip size={44} />,
    "/projects": <FaProjectDiagram size={44} />,
};

function useAccessibleLinksByRole(t: (k: string) => string, role?: Role) {
    return useMemo<LinkItem[]>(() => {
        if (!role) return [];
        const color = roleColor[role];
        const L: LinkItem[] = [];
        switch (role) {
            case Roles.LogisticsOperator:
                L.push(
                    { label: t("dashboard.qualifications"), path: "/qualifications", color, icon: routeIcon["/qualifications"] },
                    { label: t("dashboard.physicalResources"), path: "/physical-resources", color, icon: routeIcon["/physical-resources"] },
                    { label: t("dashboard.staffMembers"), path: "/staff-members", color, icon: routeIcon["/staff-members"] },
                );
                break;
            case Roles.ShippingAgentRepresentative:
                L.push({ label: t("dashboard.vvn"), path: "/vvn", color, icon: routeIcon["/vvn"] });
                break;
            case Roles.PortAuthorityOfficer:
                L.push({ label: t("dashboard.vessels"), path: "/vessels", color, icon: routeIcon["/vessels"] });
                break;
            case Roles.ProjectManager:
                L.push({ label: t("dashboard.projects"), path: "/projects", color, icon: routeIcon["/projects"] });
                break;
            case Roles.Administrator:
                L.push({ label: t("dashboard.adminPanel"), path: "/users", color, icon: <FaCogs size={44} /> });
                break;
        }
        return L;
    }, [role, t]);
}

export default function GenericDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const storeUser = useAppStore((s) => s.user);
    const { user: authUser } = useAuth0();

    const role = storeUser?.role;
    const links = useAccessibleLinksByRole(t, role);

    const displayName = authUser?.name ?? storeUser?.name ?? "";
    const email = authUser?.email ?? storeUser?.email ?? "";
    const picture = authUser?.picture ?? "";

    return (
        <div className="gd-container fade-in">
            <header className="gd-header-light" data-role={role ?? "none"}>
                <div className="gd-profile">
                    {picture ? (
                        <img src={picture} alt={displayName || "avatar"} className="gd-avatar-img" />
                    ) : (
                        <div className="gd-avatar-placeholder">
                            {(displayName || "U")
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                        </div>
                    )}
                    <div className="gd-user-info">
                        <h1 className="gd-user-name">{displayName}</h1>
                        <p className="gd-user-email">{email}</p>
                    </div>
                </div>
            </header>

            <section className="gd-links-section">
                <h2 className="gd-section-title">{t("dashboard.accessModules")}</h2>
                <div className="gd-links-list">
                    {links.map((link, idx) => (
                        <div
                            key={link.path}
                            className="gd-link-item slide-in"
                            style={{
                                animationDelay: `${idx * 0.15}s`,
                                borderTop: `5px solid ${link.color}`,
                            }}
                            onClick={() => navigate(link.path)}
                        >
                            <div className="gd-link-icon" style={{ color: link.color }}>
                                {link.icon ?? <FaRoute size={44} />}
                            </div>
                            <div className="gd-link-body">
                                <h3>{link.label}</h3>
                                <p>{t("dashboard.clickToOpen")}</p>
                            </div>
                        </div>
                    ))}

                    {links.length === 0 && (
                        <div className="gd-empty fade-in" style={{ animationDelay: "0.3s" }}>
                            {t("dashboard.noModules")}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}