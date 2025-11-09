import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";
import { FiLogOut } from "react-icons/fi";

const LogoutButton = () => {
    const { logout } = useAuth0();
    const { t } = useTranslation();

    return (
        <button
            className="logout-button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            title={t("navExit.logout") || "Logout"} // Tooltip opcional
        >
            <FiLogOut size={20} className="logout-icon-svg" />
            <span className="logout-text">{t("navExit.logout") || "Logout"}</span>
        </button>
    );
};

export default LogoutButton;