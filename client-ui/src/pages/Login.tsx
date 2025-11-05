import { useAppStore } from "../app/store";
import { Roles, type Role } from "../app/types";
import "./css/login.css";
import { FaUserShield, FaUserTie, FaUserCog, FaUsers, FaEye } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

interface CustomCSSProperties extends React.CSSProperties {
    "--btn-color"?: string;
}

export default function Login() {
    const { t } = useTranslation();
    const setUser = useAppStore((s) => s.setUser);

    async function loginAs(roleList: Role[]) {
        const loadingId = toast.loading(t("auth.loading"));

        try {
            await new Promise((res) => setTimeout(res, 900)); // simulate API

            localStorage.setItem("access_token", "dev-token");
            localStorage.setItem("sarId", "7882343c-09bf-4a74-a494-8f04c6209ef2");

            console.log(localStorage.getItem("sarId"));

            setUser({
                id: "dev-user",
                name: "Dev User",
                roles: roleList,
            });

            toast.dismiss(loadingId);
            toast.success(t("auth.success"));

            // deixamos o RequireGuest (useAithGuard class) redireccionar.

        } catch {
            toast.dismiss(loadingId);
            toast.error(t("auth.error"));
        }
    }

    const roles = [
        { icon: <FaUserShield />, label: t("roles.administrator"), role: Roles.Administrator, color: "#e63946" },
        { icon: <FaUserTie />, label: t("roles.officer"), role: Roles.PortAuthorityOfficer, color: "#4361ee" },
        { icon: <FaUserCog />, label: t("roles.operator"), role: Roles.LogisticsOperator, color: "#f3722c" },
        { icon: <FaUsers />, label: t("roles.agent"), role: Roles.ShippingAgentRepresentative, color: "#2a9d8f" },
        { icon: <FaEye />, label: t("roles.viewer"), role: Roles.Viewer, color: "#6c757d" }
    ];

    return (
        <div className="login-bg">
            <div className="login-card">
                <h2>{t("login.title")}</h2>
                <p>{t("login.subtitle")}</p>

                <div className="role-grid">
                    {roles.map((r) => (
                        <button
                            key={r.role}
                            className="role-btn"
                            style={{ "--btn-color": r.color } as CustomCSSProperties }
                            onClick={() => loginAs([r.role])}
                        >
                            <span className="icon">{r.icon}</span>
                            {r.label}
                        </button>
                    ))}
                </div>

                <div className="login-footer">
                    <small>{t("login.devNotice")}</small>
                </div>
            </div>
        </div>
    );
}
