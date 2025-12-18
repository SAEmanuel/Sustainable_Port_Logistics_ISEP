import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import { useCurrentAvatar } from "../components/hooks/useCurrentAvatar";
import { FaRoute } from "react-icons/fa";
import { useModuleLinks } from "../hooks/useModuleLinks";
import "./css/genericDashboard.css";

export default function GenericDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const storeUser = useAppStore((s) => s.user);
    const { user: authUser } = useAuth0();

    const role = storeUser?.role;

    const allLinks = useModuleLinks(t, role);

    const links = useMemo(() => {
        return allLinks.filter(link => link.path !== "/dashboard");
    }, [allLinks]);

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
                            style={{ objectFit: "cover" }}
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
                                {React.isValidElement(link.icon)
                                    ? React.cloneElement(link.icon as React.ReactElement<any>, { size: 44 })
                                    : <FaRoute size={44} />
                                }
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