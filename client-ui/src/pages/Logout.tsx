import { useEffect } from "react";
import { logout } from "../services/auth";

export default function Logout() {
    useEffect(() => {
        logout();
        window.location.href = "/login";
    }, []);

    return <div>A terminar sessão...</div>;
}
