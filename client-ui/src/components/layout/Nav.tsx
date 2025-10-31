import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";

export default function Nav() {
    const user = useAppStore((s) => s.user);

    return (
        <nav className="nav">
            <Link to="/">Início</Link>

            {user && (
                <>
                    <Link to="/vvn">VVNs</Link>
                    <Link to="/storage-areas">Storage Areas</Link>
                    
                    {(user.roles.includes("Admin") || user.roles.includes("Manager")) && (
                        <Link to="/admin">Admin</Link>
                    )}
                </>
            )}

            {!user ? <Link to="/login">Login</Link> : <Link to="/logout">Sair</Link>}
        </nav>
    );
}
