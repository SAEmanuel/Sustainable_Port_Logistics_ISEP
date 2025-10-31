import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";

interface MenuItem {
    label: string;
    path: string;
}

export default function Nav() {
    const user = useAppStore((s) => s.user);

    // array de items com tipagem
    const menuItems: MenuItem[] = [{ label: "Início", path: "/" }];

    // adiciona opções se o user existir
    if (user) {
        menuItems.push(
            { label: "VVNs", path: "/vvn" },
            { label: "Storage Areas", path: "/storage-areas" }
        );
    }

    // adiciona opções de admin
    if (user?.roles?.includes("Admin")) {
        menuItems.push({ label: "Admin", path: "/admin" });
    }

    return (
        <nav className="nav">
            <ul>
                {menuItems.map((item) => (
                    <li key={item.path}>
                        <Link to={item.path}>{item.label}</Link>
                    </li>
                ))}

                {!user ? (
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                ) : (
                    <li>
                        <Link to="/logout">Sair</Link>
                    </li>
                )}
            </ul>
        </nav>
    );
}
