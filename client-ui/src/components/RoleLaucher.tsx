import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppStore } from "../app/store";
import { Roles } from "../app/types";
import { useTranslation } from "react-i18next";

export default function RoleLauncher() {
    const { t } = useTranslation();
    const { user: authUser } = useAuth0();
    const user = useAppStore((s) => s.user);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const avatar = authUser?.picture ?? null;
    const displayName = authUser?.name ?? user?.name ?? "User";

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const goToRoleHome = (role: string) => {
        switch (role) {
            case Roles.Administrator:
                navigate("/dashboard");
                break;
            case Roles.LogisticsOperator:
                navigate("/dashboard");
                break;
            case Roles.ShippingAgentRepresentative:
                navigate("/dashboard");
                break;
            case Roles.PortAuthorityOfficer:
                navigate("/dashboard");
                break;
            default:
                navigate("/");
                break;
        }
    };

    const onClick = () => {
        if (user?.role) {
            goToRoleHome(user.role);
        } else {
            setOpen((v) => !v);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={onClick}
                className="user-launcher-btn"
                title={
                    user?.role
                        ? t("roleLauncher.titleAuthorized", { role: user.role })
                        : t("roleLauncher.awaitingTitle")
                }
            >
                {avatar ? (
                    <img src={avatar} alt={displayName} referrerPolicy="no-referrer" />
                ) : (
                    <FaUserCircle size={22} className="login-icon" />
                )}
            </button>

            {/* Dropdown visível apenas se não tiver role */}
            {open && !user?.role && (
                <div
                    className="role-waiting-dropdown"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 38,
                        width: 260,
                        background: "var(--card-bg)",
                        color: "var(--text)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                        padding: "12px 14px",
                        zIndex: 60,
                        fontSize: 14,
                        backdropFilter: "blur(10px)",
                        animation: "fadeSlideDown 0.25s ease"
                    }}
                >
                    <strong style={{ display: "block", marginBottom: 6 }}>
                        {t("roleLauncher.awaitingHeader")}
                    </strong>
                    <span style={{ opacity: 0.85, fontWeight: 400 }}>
            {t("roleLauncher.awaitingMessage")}
          </span>
                </div>
            )}
        </div>
    );
}