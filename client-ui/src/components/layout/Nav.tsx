// Nav.tsx
import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";
import { Roles } from "../../app/types";
import { useTranslation } from "react-i18next";

export default function Nav() {
    const { t } = useTranslation();
    const user = useAppStore((s) => s.user);
    const feature3D = import.meta.env.VITE_FEATURE_3D !== "0"; // por defeito ON

    const baseMenu = [{ label: t("menu.home"), path: "/" }];

    const adminMenu = user?.roles.includes(Roles.Administrator)
        ? [
            { label: t("menu.storageArea"), path: "/storage-areas" },
            { label: t("menu.vvn"), path: "/vvn" },
            { label: t("menu.vesselTypes"), path: "/vessel-types" },
            { label: t("menu.vessels"), path: "/vessels" },
            { label: t("menu.admin"), path: "/admin" },
            ...(feature3D ? [{ label: "3D Viewer", path: "/viewer" }] : []),
        ]
        : [];

    const operatorMenu = user?.roles.includes(Roles.LogisticsOperator)
        ? [
            { label: t("menu.dashboard"), path: "/logistics-dashboard" },
            { label: t("menu.qualifications"), path: "/qualifications" },
            ...(feature3D ? [{ label: "3D Viewer", path: "/viewer" }] : []),
        ]
        : [];

    const officerMenu = user?.roles.includes(Roles.PortAuthorityOfficer)
        ? [...(feature3D ? [{ label: "3D Viewer", path: "/viewer" }] : [])]
        : [];

    const sarMenu = user?.roles.includes(Roles.ShippingAgentRepresentative)
        ? [{ label: t("menu.vvn"), path: "/vvn" }]
        : [];

    const privateMenu = user ? [] : [];

    const menu = [...baseMenu, ...privateMenu, ...adminMenu, ...operatorMenu, ...officerMenu, ...sarMenu];

    return (
        <nav className="nav">
            <ul>
                {menu.map((i) => (
                    <li key={i.path}><Link to={i.path}>{i.label}</Link></li>
                ))}
                {!user ? (
                    <li><Link to="/login">{t("menu.login")}</Link></li>
                ) : (
                    <li><Link to="/logout">{t("menu.logout")}</Link></li>
                )}
            </ul>
        </nav>
    );
}
