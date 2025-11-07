import {JSX, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { Roles, type Role } from "../app/types";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import {
    FaUsers, FaCogs, FaCertificate, FaUniversity, FaShip, FaProjectDiagram, FaRoute,
} from "react-icons/fa";
import "./css/genericDashboard.css";

type LinkItem = { label: string; path: string; color: string; icon: JSX.Element };

const roleColor: Record<Role, string> = {
    [Roles.Administrator]: "#e63946",
    [Roles.PortAuthorityOfficer]: "#4361ee",
    [Roles.ShippingAgentRepresentative]: "#f3722c",
    [Roles.LogisticsOperator]: "#2a9d8f",
    [Roles.ProjectManager]: "#9b59b6",
};

const routeIcon: Record<string, JSX.Element> = {
    "/vvn": <FaUniversity size={56} />,
    "/qualifications": <FaCertificate size={56} />,
    "/staff-members": <FaUsers size={56} />,
    "/physical-resources": <FaCogs size={56} />,
    "/vessels": <FaShip size={56} />,
    "/projects": <FaProjectDiagram size={56} />,
};

function getModuleKey(path: string) {
    return path.split("?")[0].replace(/^\/|\/$/g, "") || "root";
}

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
                L.push({ label: t("dashboard.adminPanel"), path: "/users", color, icon: <FaCogs size={56} /> });
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
        <div className="gd-container">
            {/* HEADER com data-role */}
            <header className="gd-header-modern" data-role={role ?? "none"}>
                <div className="gd-profile">
                    {picture ? (
                        <img src={picture} alt={displayName || "avatar"} className="gd-avatar gd-avatar--img" />
                    ) : (
                        <div className="gd-avatar">
                            {(displayName || "U")
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="gd-username">{displayName}</h1>
                        {email && <p className="gd-role" style={{ color: role ? roleColor[role] : "inherit" }}>{email}</p>}
                    </div>
                </div>
            </header>

            {/* LINKS com data-module para cores por módulo */}
            <section className="gd-links-section">
                <h2 className="gd-section-title">{t("dashboard.accessModules")}</h2>
                <div className="gd-links-grid">
                    {links.map((link) => {
                        const moduleKey = getModuleKey(link.path);
                        return (
                            <div
                                key={link.path}
                                className="gd-link-card"
                                data-module={moduleKey}
                                tabIndex={0}
                                role="button"
                                aria-label={`${link.label}. ${t("dashboard.clickToOpen")}`}
                                onClick={() => navigate(link.path)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        navigate(link.path);
                                    }
                                }}
                            >
                                <div
                                    className="gd-link-icon"
                                    style={{
                                        background: `${link.color}22`,
                                        border: `1px solid ${link.color}55`,
                                        color: link.color,
                                    }}
                                >
                                    {link.icon ?? <FaRoute size={56} />}
                                </div>
                                <div className="gd-link-body">
                                    <h3>{link.label}</h3>
                                    <p>{t("dashboard.clickToOpen")}</p>
                                </div>
                            </div>
                        );
                    })}
                    {links.length === 0 && <div className="gd-empty">{t("dashboard.noModules")}</div>}
                </div>
            </section>
        </div>
    );
}