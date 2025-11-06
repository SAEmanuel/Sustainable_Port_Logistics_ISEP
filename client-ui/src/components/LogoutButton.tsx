import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

export default function LogoutButton() {
    const { logout, isAuthenticated } = useAuth0();
    const { t } = useTranslation();

    if (!isAuthenticated) return null;

    return (
        <button
            onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="text-red-500 hover:text-red-600 font-medium transition"
        >
            {t("auth.signOut")}
        </button>
    );
}