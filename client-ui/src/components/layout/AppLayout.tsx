import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import { FaShip } from "react-icons/fa";

export default function AppLayout() {
    return (
        <div className="app">
            <header className="header">
                <div className="brand">
                    <FaShip size={32} color="#1A73E8" />
                    <h1>ThPA Port Management System</h1>
                </div>
                <Nav />
            </header>

            <main className="content">
                <Outlet />
            </main>

            <footer className="footer">
                © 2025 ThPA S.A. — Smart Port Operations Platform
            </footer>
        </div>
    );
}
