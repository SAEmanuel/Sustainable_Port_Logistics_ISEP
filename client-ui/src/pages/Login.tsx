import { loginDev } from "../services/auth";

export default function Login() {
    async function handleLogin() {
        // token “falso” para arrancar; depois será OIDC redirect
        await loginDev("dev-token");
        window.location.href = "/";
    }
    return (
        <div>
            <h2>Login</h2>
            <button onClick={handleLogin}>Entrar (Dev)</button>
        </div>
    );
}
