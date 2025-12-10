import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {API_WEBAPI} from "../config/api.ts";

export default function ActivateAccount() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState(t("activation.loading"));
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const navigate = useNavigate();

    useEffect(() => {
        const email = searchParams.get("email");
        if (!email) {
            setMessage(t("activation.missingLink"));
            setStatus("error");
            return;
        }

        const verifyAndActivate = async () => {
            try {
                const userRes = await fetch(
                    `${API_WEBAPI}/api/user/email/${encodeURIComponent(email)}`
                );

                if (!userRes.ok) {
                    setMessage(t("activation.invalidLink"));
                    setStatus("error");
                    return;
                }

                const user = await userRes.json();

                if (user.eliminated === true) {
                    setMessage(t("activation.removedAccount"));
                    setStatus("error");
                    return;
                }

                const activateRes = await fetch(
                    `${API_WEBAPI}/api/user/activate?email=${encodeURIComponent(email)}`,
                    { method: "PUT" }
                );

                const text = await activateRes.text();
                console.log("Activation response:", activateRes.status, text);

                if (activateRes.ok) {
                    setMessage(text || t("activation.successMessage"));
                    setStatus("success");
                } else {
                    setMessage(text || t("activation.failedMessage"));
                    setStatus("error");
                }
            } catch (err) {
                console.error(err);
                setMessage(t("activation.unexpectedError"));
                setStatus("error");
            }
        };

        verifyAndActivate();
    }, [searchParams, t]);

    const handleGoHome = () => {
        navigate("/");
        window.location.reload();
    };

    return (
        <section
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#f5f7fa",
                color: "#333",
                textAlign: "center",
                padding: "2rem",
            }}
        >
            <h2>
                {status === "success"
                    ? t("activation.titleSuccess")
                    : status === "error"
                        ? t("activation.titleError")
                        : t("activation.titleLoading")}
            </h2>

            <p style={{ marginTop: "1rem", maxWidth: 520 }}>{message}</p>

            {status === "success" && (
                <button
                    onClick={handleGoHome}
                    style={{
                        marginTop: "1.5rem",
                        padding: "0.8rem 1.4rem",
                        border: "none",
                        borderRadius: 8,
                        background: "#1d3557",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                >
                    {t("activation.goHome")}
                </button>
            )}
        </section>
    );
}