import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import Profile from "../Profile";
import LogoutButton from "../LogoutButton";
import { useModuleLinks } from "../../hooks/useModuleLinks"; // IMPORTAR O NOVO HOOK

import {
    FiHome,
    FiLayers,
    FiTablet
} from "react-icons/fi";

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


    const roleLinks = useModuleLinks(t, user?.role);
    const menu = [...baseMenu, ...roleLinks];

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