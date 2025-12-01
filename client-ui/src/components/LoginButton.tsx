import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import "../styles/login.css";

export default function LoginButton() {
    const { loginWithRedirect } = useAuth0();
    const [showButton, setShowButton] = useState(false);

    const handleLogin = async () => {
        await loginWithRedirect({
            appState: { returnTo: window.location.pathname },
            authorizationParams: { prompt: "select_account" }
        });
    };

    return (
        <div className="pageContainer">
            <video
                src="/login.mov"
                autoPlay
                muted
                playsInline
                onEnded={() => setShowButton(true)}
                className="backgroundVideo"
            />

            {showButton && (
                <button onClick={handleLogin} className="loginButton">
                    Login
                </button>
            )}
        </div>
    );
}