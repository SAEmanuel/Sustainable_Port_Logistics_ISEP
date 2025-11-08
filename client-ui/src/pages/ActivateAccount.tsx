import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ActivateAccount() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("🔄 Activating your account...");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const navigate = useNavigate();

    useEffect(() => {
        const email = searchParams.get("email");
        if (!email) {
            setMessage("⚠️ Invalid or missing activation link.");
            setStatus("error");
            return;
        }

        const verifyAndActivate = async () => {
            try {
                const userRes = await fetch(
                    `http://localhost:5008/api/user/email/${encodeURIComponent(email)}`
                );

                if (!userRes.ok) {
                    setMessage("⚠️ This activation link is invalid or expired (user not found).");
                    setStatus("error");
                    return;
                }

                const user = await userRes.json();

                if (user.eliminated === true) {
                    setMessage("❌ This account has been removed. The activation link is no longer valid.");
                    setStatus("error");
                    return;
                }

                const activateRes = await fetch(
                    `http://localhost:5008/api/user/activate?email=${encodeURIComponent(email)}`
                );

                const text = await activateRes.text();

                if (activateRes.ok) {
                    setMessage(text || "✅ Account activated successfully!");
                    setStatus("success");
                } else {
                    setMessage(text || "⚠️ Activation failed. Please contact support.");
                    setStatus("error");
                }
            } catch (err) {
                console.error(err);
                setMessage("❌ An unexpected error occurred while activating your account.");
                setStatus("error");
            }
        };

        verifyAndActivate();
    }, [searchParams]);

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
                    ? "✅ Account Activated"
                    : status === "error"
                        ? "❌ Activation Failed"
                        : "⏳ Please wait"}
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
                    Go to Home
                </button>
            )}
        </section>
    );
}