import { Outlet } from "react-router-dom";
import Nav from "./Nav";

export default function AppLayout() {
    return (
        <div className="app">
            <header className="header">
                <h1>Port Management</h1>
                <Nav />
            </header>
            <main className="content">
                <Outlet />
            </main>
            <footer className="footer">© 2025 ISEP — SEM5-PI</footer>
        </div>
    );
}
