import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

const LoginButton = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const { t } = useTranslation();

    if (isAuthenticated) return null;

    return (
        <button
            onClick={() => loginWithRedirect()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
        >
            {t("auth.signIn")}
        </button>
    );
};

export default LoginButton;