import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";
import { Roles } from "../../app/types";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import Profile from "../Profile";
import LogoutButton from "../LogoutButton";

import {
    FiHome,
    FiBox,
    FiSettings,
    FiUsers,
    FiGrid,
    FiBriefcase,
    FiUserCheck,
    FiFileText,
    FiAnchor,
    FiLayers, FiMapPin,
} from "react-icons/fi";
import {FaShip} from "react-icons/fa";

type NavProps = {
    isOpen: boolean;
};

export default function Nav({ isOpen }: NavProps) {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth0();
    const user = useAppStore((s) => s.user);

    const baseMenu = [
        { label: t("menu.home"), path: "/", icon: <FiHome /> },
        { label: t("menu.3dView"), path: "/3dSecene", icon: <FiLayers /> },

    ];

    const adminMenu = user?.role?.includes(Roles.Administrator)
        ? [
            { label: t("menu.admin"), path: "/users", icon: <FiSettings /> },
            { label: t("menu.vvn"), path: "/vvn", icon: <FiFileText /> },
        ]
        : [];

    const operatorMenu = user?.role?.includes(Roles.LogisticsOperator)
        ? [
            { label: t("menu.dashboard"), path: "/dashboard", icon: <FiGrid /> },
            { label: t("menu.qualifications"), path: "/qualifications", icon: <FiUserCheck /> },
            { label: t("menu.staffMembers"), path: "/staff-members", icon: <FiUsers /> },
            { label: t("menu.physicalResource"), path: "/physical-resources", icon: <FiBriefcase /> },
        ]
        : [];

    const portAuthorityOfficerMenu = user?.role?.includes(Roles.PortAuthorityOfficer)
        ? [
            { label: t("menu.storageArea"), path: "/storage-areas", icon: <FiBox /> },
            { label: t("menu.docks"), path: "/docks", icon: <FiMapPin /> },
            { label: t("menu.vesselTypes"), path: "/vessel-types", icon: <FiAnchor /> },
            { label: t("menu.vessels"), path: "/vessels", icon: <FaShip /> },
            { label: t("menu.vvnResponse"), path: "/responsevvn", icon: <FiFileText /> },
            { label: t("menu.sao"), path: "/sao", icon: <FiFileText /> },
            { label: t("menu.sar"), path: "/sar", icon: <FiFileText /> }
        ]
        : [];

    const sarMenu = user?.role?.includes(Roles.ShippingAgentRepresentative)
        ? [
            { label: t("menu.vvn"), path: "/vvn", icon: <FiFileText /> },
        ]
        : [];

    const menu = [...baseMenu, ...adminMenu, ...operatorMenu, ...sarMenu, ...portAuthorityOfficerMenu];

    const uniqueMenu = menu.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.path === item.path
            ))
    );

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="sidebar-content">
                <nav>
                    <ul>
                        {uniqueMenu.map((i) => (
                            <li key={i.path}>
                                <Link to={i.path}>
                                    <span className="menu-icon">{i.icon}</span>
                                    <span>{i.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {isAuthenticated && (
                    <div className="sidebar-footer">
                        <Profile />
                        <LogoutButton />
                    </div>
                )}
            </div>
        </aside>
    );
}