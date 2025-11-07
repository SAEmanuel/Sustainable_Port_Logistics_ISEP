import {useAuth0} from "@auth0/auth0-react";
import {useTranslation} from "react-i18next";

export default function LogoutButton() {
    const {logout, isAuthenticated} = useAuth0();
    const {t} = useTranslation();

    if (!isAuthenticated) return null;

    return (
        <button
            onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="sidebar-logout"
        >
            {t("auth.signOut")}
        </button>
    );
}