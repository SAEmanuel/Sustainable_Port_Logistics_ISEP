import { useAppStore } from "../app/store";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./css/inacticeAccount.css";

export default function InactiveAccount() {
    const { t } = useTranslation();
    const user = useAppStore((s) => s.user);
    const navigate = useNavigate();

    const email = user?.email ?? "your registered email";

    return (
        <section className="inactive-container">
            <div className="inactive-card">
                <div className="inactive-icon">⚠️</div>

                <h2 className="inactive-title">
                    {t("inactive.title", "Account Inactive")}
                </h2>

                <p className="inactive-message">
                    {t(
                        "inactive.message",
                        "Your account is currently inactive and cannot access the system."
                    )}
                </p>

                <div className="inactive-info">
                    <strong>{t("inactive.nextStep", "To activate your account:")}</strong>
                    <p>
                        {t(
                            "inactive.instructions",
                            "Please check your email inbox and follow the activation link sent to:"
                        )}
                    </p>
                    <div className="inactive-email">{email}</div>
                </div>

                <div className="inactive-actions">
                    <button
                        className="inactive-back-btn"
                        onClick={() => navigate("/")}
                    >
                        <FaArrowLeft size={16} style={{ marginRight: 8 }} />
                        {t("inactive.actions.back", "Back to Home")}
                    </button>
                </div>

                <p className="inactive-hint">
                    {t(
                        "inactive.contact",
                        "If you didn’t receive any email, please contact the system administrator."
                    )}
                </p>
            </div>
        </section>
    );
}