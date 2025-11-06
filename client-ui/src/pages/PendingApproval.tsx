import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../app/store";
import { Roles } from "../app/types";

export default function PendingApproval() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAppStore((s) => s.user);

    useEffect(() => {
        if (!user) return;
        switch (user.role) {
            case Roles.Administrator:
                navigate("/dashboard", { replace: true });
                break;
            case Roles.PortAuthorityOfficer:
                navigate("/dashboard", { replace: true });
                break;
            case Roles.LogisticsOperator:
                navigate("/dashboard", { replace: true });
                break;
            case Roles.ShippingAgentRepresentative:
                navigate("/dashboard", { replace: true });
                break;
            default:
                break;
        }
    }, [user, navigate]);

    return (
        <section
            style={{
                maxWidth: 640,
                margin: "40px auto",
                padding: "32px",
                background: "var(--card-bg)",
                color: "var(--text)",
                borderRadius: 14,
                boxShadow: "0 8px 26px rgba(0,0,0,0.12)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
            }}
        >
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{t("pending.title")}</h2>
            <p style={{ marginTop: 0, opacity: 0.9 }}>{t("pending.subtitle")}</p>

            <div
                style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 8,
                    background: "rgba(79,163,255,0.08)",
                    border: "1px solid rgba(79,163,255,0.25)",
                    textAlign: "left",
                }}
            >
                <strong>{t("pending.userInfo")}</strong>
                <div style={{ marginTop: 6 }}>
                    <div>{t("pending.name")}: {user?.name || "-"}</div>
                    <div>{t("pending.email")}: {user?.email || "-"}</div>
                    <div>{t("pending.currentRole")}: {user?.role || t("pending.none")}</div>
                </div>
            </div>

            <p style={{ marginTop: 18 }}>{t("pending.body")}</p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 20,
                    marginTop: 26,
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={() => window.location.reload()}
                    title={t("pending.actions.refresh")}
                    style={buttonStyle}
                >
                    {t("pending.actions.refresh")}
                </button>

                <button
                    onClick={() => navigate("/", { replace: true })}
                    title={t("pending.actions.goHome")}
                    style={buttonStyle}
                >
                    {t("pending.actions.goHome")}
                </button>
            </div>

            <p style={{ marginTop: 20, fontSize: 14, opacity: 0.8 }}>
                {t("pending.contactHelp")}
            </p>
        </section>
    );
}

const buttonStyle: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    fontWeight: 500,
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};