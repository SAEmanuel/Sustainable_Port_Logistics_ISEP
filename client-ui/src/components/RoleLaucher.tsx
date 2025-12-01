import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppStore } from "../app/store";
import { Roles } from "../app/types";
import { useTranslation } from "react-i18next";
import {API_WEBAPI} from "../config/api.ts";

export default function RoleLauncher() {
    const { t } = useTranslation();
    const { user: authUser, getAccessTokenSilently, isAuthenticated } = useAuth0();
    const { user, setUser } = useAppStore();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const fetchUserFromBackend = async () => {
        if (!isAuthenticated || !authUser?.email) return;
        setLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(
                `${API_WEBAPI}/api/user/email/${encodeURIComponent(authUser.email)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            if (!res.ok) {
                console.warn("Utilizador não encontrado no backend.");
                setLoading(false);
                return;
            }

            const freshUser = await res.json();
            setUser(freshUser);
            setLoading(false);
            return freshUser;
        } catch (err) {
            console.error("Erro ao sincronizar utilizador:", err);
            setLoading(false);
        }
    };

    const goToRoleHome = (role: string) => {
        switch (role) {
            case Roles.Administrator:
            case Roles.LogisticsOperator:
            case Roles.ShippingAgentRepresentative:
            case Roles.PortAuthorityOfficer:
            case Roles.ProjectManager:
                navigate("/dashboard");
                break;
            default:
                navigate("/");
                break;
        }
    };

    const onClick = async () => {
        const freshUser = await fetchUserFromBackend();
        console.log(freshUser);
        if (!freshUser) {
            navigate("/login");
            return;
        }

        if (freshUser.eliminated === true) {
            navigate("/deleted");
            return;
        }

        if (freshUser.isActive === false) {
            navigate("/inactive");
            return;
        }

        if (freshUser.role) {
            goToRoleHome(freshUser.role);
            return;
        }

        setOpen((v) => !v);
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
                disabled={loading}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                            border:
                                user?.isActive === false
                                    ? "2px solid #e63946"
                                    : "2px solid transparent",
                        }}
                    />
                ) : (
                    <FaUserCircle size={24} className="login-icon" />
                )}
            </button>

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
                        animation: "fadeSlideDown 0.25s ease",
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