import { useAuth0 } from "@auth0/auth0-react";
import "../styles/login-port.css";

export default function LoginPort() {
    const { loginWithRedirect } = useAuth0();

    const handleLogin = async () => {
        await loginWithRedirect({
            appState: { returnTo: window.location.pathname },
            authorizationParams: { prompt: "select_account" }
        });
    };

    return (
        <div className="port-container">
            <div className="background-grid"></div>

            <div className="radar-scope">
                <div className="radar-sweep"></div>
                <div className="radar-center-dot"></div>
            </div>

            <div className="shipping-lane">
                <svg className="ship-silhouette cargo-ship-large" viewBox="0 0 600 150">
                    <path d="M50,140 L550,140 L580,110 L20,110 Z" className="ship-body" />
                    <rect x="80" y="70" width="80" height="40" className="ship-cargo" />
                    <rect x="170" y="70" width="80" height="40" className="ship-cargo" />
                    <rect x="260" y="60" width="80" height="50" className="ship-cargo" />
                    <polygon points="450,110 450,40 520,40 540,110" className="ship-bridge" />
                </svg>

                <svg className="ship-silhouette tanker-ship-small" viewBox="0 0 400 120">
                    <path d="M30,110 L370,110 L390,80 L10,80 Z" className="ship-body" />
                    <rect x="50" y="60" width="200" height="20" className="ship-cargo" />
                    <polygon points="300,80 300,30 350,30 360,80" className="ship-bridge" />
                </svg>
            </div>

            <div className="interface-layer">
                <div className="glass-panel">
                    <h1 className="system-title">Port<span>Logistics</span></h1>
                    <div className="status-container">
                        <span className="status-light pulse"></span>
                        <p className="system-status">SYSTEM READY // WAITING FOR AUTH</p>
                    </div>

                    <div className="monitoring-data">
                        <p className="data-line">Developed with &lt;3</p>
                        <p className="data-line team-flicker">MakeItSimple</p>
                        <p className="data-line">v3.1.0</p>
                    </div>

                    <button onClick={handleLogin} className="activate-btn">
                        <span className="btn-text">SECURE LOGIN</span>
                        <div className="btn-glitch"></div>
                        <div className="btn-border-pulse"></div>
                    </button>
                </div>
            </div>

            <div className="noise-overlay"></div>
            <div className="scanlines-overlay"></div>
        </div>
    );
}