import {NavLink} from "react-router-dom";
import {useAppStore} from "../../app/store";
import {Roles} from "../../app/types";
import {useTranslation} from "react-i18next";
import {useAuth0} from "@auth0/auth0-react";
import Profile from "../Profile";
import LogoutButton from "../LogoutButton";

export default function Nav() {
    const {t} = useTranslation();
    const {isAuthenticated} = useAuth0();
    const user = useAppStore((s) => s.user);

    const baseMenu = [{label: t("menu.home"), path: "/"}];

    const adminMenu = user?.role?.includes(Roles.Administrator)
        ? [
            {label: t("menu.storageArea"), path: "/storage-areas"},
            {label: t("menu.vvn"), path: "/vvn"},
            {label: t("menu.vesselTypes"), path: "/vessel-types"},
            {label: t("menu.vessels"), path: "/vessels"},
            {label: t("menu.admin"), path: "/admin"},
        ]
        : [];

    const operatorMenu = user?.role?.includes(Roles.LogisticsOperator)
        ? [
            {label: t("menu.dashboard"), path: "/dashboard"},
            {label: t("menu.qualifications"), path: "/qualifications"},
            {label: t("menu.staffMembers"), path: "/staff-members"},
            {label: t("menu.physicalResource"), path: "/physical-resources"},
        ]
        : [];

    const sarMenu = user?.role?.includes(Roles.ShippingAgentRepresentative)
        ? [{label: t("menu.vvn"), path: "/vvn"}]
        : [];

    const menu = [...baseMenu, ...adminMenu, ...operatorMenu, ...sarMenu];

    return (
        <nav className="sidebar-nav" aria-label="Primary">
            {isAuthenticated && (
                <div className="sidebar-profile-card">
                    <Profile />
                    <div className="sidebar-profile-card__actions">
                        <LogoutButton />
                    </div>
                </div>
            )}

            <div className="sidebar-nav__section">
                <span className="sidebar-nav__label">{t("menu.navigation", {defaultValue: "Menu"})}</span>
                <ul className="sidebar-menu">
                    {menu.map((item) => (
                        <li key={item.path} className="sidebar-menu__item">
                            <NavLink
                                to={item.path}
                                className={({isActive}) =>
                                    `sidebar-menu__link ${isActive ? "is-active" : ""}`
                                }
                                end={item.path === "/"}
                            >
                                <span className="sidebar-menu__indicator" aria-hidden="true" />
                                <span className="sidebar-menu__text">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}