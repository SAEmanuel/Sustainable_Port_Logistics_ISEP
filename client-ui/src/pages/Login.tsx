import { useNavigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { Roles } from "../app/types";
import "./css/login.css";
import type { Role } from "../app/types"; 

export default function Login() {
    const navigate = useNavigate();
    const setUser = useAppStore((s) => s.setUser);

    function loginAs(roleList: Role[]) {
        // simular login — guarda token e cria user
        localStorage.setItem("access_token", "dev-token");

        setUser({
            id: "dev-user",
            name: "Dev User",
            roles: roleList,
        });

        navigate("/");
    }

    return (
        <div className="login-container">
            <h2>Autenticação</h2>
            <p>Escolha um perfil para entrar na plataforma</p>

            <div className="login-buttons">
                <button onClick={() => loginAs([Roles.Administrator])}>
                    Entrar como Administrador
                </button>

                <button onClick={() => loginAs([Roles.PortAuthorityOfficer])}>
                    Entrar como Port Authority Officer
                </button>

                <button onClick={() => loginAs([Roles.LogisticsOperator])}>
                    Entrar como Logistics Operator
                </button>

                <button onClick={() => loginAs([Roles.ShippingAgentRepresentative])}>
                    Entrar como Shipping Agent Representative
                </button>

                <button onClick={() => loginAs([Roles.Viewer])}>
                    Entrar como Viewer
                </button>
            </div>

            <p className="hint">
                (Modo Dev — Esta página será substituída pelo login real OAuth)
            </p>
        </div>
    );
}
