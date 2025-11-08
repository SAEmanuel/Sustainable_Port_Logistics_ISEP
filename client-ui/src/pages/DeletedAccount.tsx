import { useAppStore } from "../app/store";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaBan, FaArrowLeft } from "react-icons/fa";
import "./css/deletedAccount.css";

export default function DeletedAccount() {
    const { t } = useTranslation();
    const user = useAppStore((s) => s.user);
    const navigate = useNavigate();

    const email = user?.email;

    return (
        <section className="deleted-container">
            <div className="deleted-card">
                <div className="deleted-icon">
                    <FaBan size={64} color="#e63946" />
                </div>

                <h2 className="deleted-title">
                    {t("deleted.title", "Account Deleted")}
                </h2>

                <p className="deleted-message">
                    {t(
                        "deleted.message",
                        "Your account has been permanently deleted and access to the system has been revoked."
                    )}
                </p>

                <div className="deleted-info">
                    <strong>
                        {t("deleted.details", "Account Details:")}
                    </strong>
                    <p>
                        {t(
                            "deleted.emailText",
                            "This account was associated with the email address:"
                        )}
                    </p>
                    <div className="deleted-email">{email}</div>
                </div>

                <div className="deleted-actions">
                    <button
                        className="deleted-back-btn"
                        onClick={() => navigate("/")}
                    >
                        <FaArrowLeft size={16} style={{ marginRight: 8 }} />
                        {t("deleted.actions.back", "Return to Home")}
                    </button>
                </div>

                <p className="deleted-hint">
                    {t(
                        "deleted.contact",
                        "If you believe this was a mistake, please contact the system administrator."
                    )}
                </p>
            </div>
        </section>
    );
}