import { type JSX, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { Roles, type Role } from "../app/types";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import { useCurrentAvatar } from "../components/hooks/useCurrentAvatar";
import {
    FaUsers,
    FaCogs,
    FaCertificate,
    FaUniversity,
    FaShip,
    FaProjectDiagram,
    FaRoute
} from "react-icons/fa";
import {
FiShuffle,FiTablet
} from "react-icons/fi";
import "./css/genericDashboard.css";
import {FiAnchor, FiBox, FiFileText, FiMapPin} from "react-icons/fi";

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
    "/storageArea": <FiBox size={44} />,
    "/docks": <FiMapPin size={44} />,
    "/vesselTypes": <FiAnchor size={44} />,
    "/vvnResponse": <FiFileText size={44} />,
    "/sao": <FiFileText size={44} />,
    "/DR": <FiTablet size={44} />,
    "/DRAdmin": <FiShuffle size={44} />,
};

function useAccessibleLinksByRole(t: (k: string) => string, role?: "Administrator" | "PortAuthorityOfficer" | "LogisticsOperator" | "ShippingAgentRepresentative" | "ProjectManager" | null | undefined) {
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
                    { label: t("dashboard.port3d"), path: "/3dSecene", color, icon: routeIcon["/3dSecene"] },
                );
                L.push({ label: t("dashboard.dd"), path: "/DR", color, icon: routeIcon["/DR"] },);

                break;
            case Roles.ShippingAgentRepresentative:
                L.push({ label: t("dashboard.vvn"), path: "/vvn", color, icon: routeIcon["/vvn"] });
                L.push({ label: t("dashboard.dd"), path: "/DR", color, icon: routeIcon["/DR"] },);

                break;
            case Roles.PortAuthorityOfficer:
                L.push({ label: t("dashboard.docks"), path: "/docks", color, icon: routeIcon["/docks"] });
                L.push({ label: t("dashboard.responsevvn"), path: "/responsevvn", color, icon: routeIcon["/vvnResponse"] });
                L.push({ label: t("dashboard.vessels"), path: "/vessels", color, icon: routeIcon["/vessels"] });
                L.push({ label: t("dashboard.vessel-types"), path: "/vessel-types", color, icon: routeIcon["/vesselTypes"] });
                L.push({ label: t("dashboard.storage-areas"), path: "/storage-areas", color, icon: routeIcon["/storageArea"] });
                L.push({ label: t("dashboard.sao"), path: "/sao", color, icon: routeIcon["/sao"] },);
                L.push({ label: t("dashboard.port3d"), path: "/3dSecene", color, icon: routeIcon["/3dSecene"] },);
                L.push({ label: t("dashboard.dd"), path: "/DR", color, icon: routeIcon["/DR"] },);

                break;
            case Roles.ProjectManager:
                L.push({ label: t("dashboard.planning"), path: "/planning-scheduling", color, icon: routeIcon["/projects"] });
                L.push({ label: t("dashboard.port3d"), path: "/3dSecene", color, icon: routeIcon["/3dSecene"] },);
                L.push({ label: t("dashboard.dd"), path: "/DR", color, icon: routeIcon["/DR"] },);
                break;


            case Roles.Administrator:
                L.push({ label: t("dashboard.adminPanel"), path: "/users", color, icon: <FaCogs size={44} /> });
                L.push({ label: t("menu.vvn"), path: "/vvn", color, icon: <FiFileText size={44} /> });
                L.push({ label: t("dashboard.port3d"), path: "/3dSecene", color, icon: routeIcon["/3dSecene"] },);
                L.push({ label: t("dashboard.dd"), path: "/DR", color, icon: routeIcon["/DR"] },);
                L.push({ label: t("dashboard.ddAdmin"), path: "/DRAdmin", color, icon: routeIcon["/DRAdmin"] },);
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

    const displayName = storeUser?.name ?? authUser?.name ?? ""; 
    const email = storeUser?.email ?? authUser?.email ?? ""; 

    const picture = useCurrentAvatar();

    return (
        <div className="gd-container fade-in">
            <header className="gd-header-light" data-role={role ?? "none"}>
                <div className="gd-profile">
                    {picture ? (
                        <img
                            src={picture}
                            alt={displayName || "avatar"}
                            className="gd-avatar-img"
                            style={{ objectFit: "cover" }} // Garante que não fica distorcida
                        />
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