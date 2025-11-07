import {Outlet} from "react-router-dom";
import {FaShip, FaSun, FaMoon, FaBars, FaTimes} from "react-icons/fa";
import {useState, useEffect} from "react";
import {useTranslation} from "react-i18next";
import Nav from "./Nav";
import "./layout.css";
import {useAppStore} from "../../app/store";
import {Roles} from "../../app/types";
import RoleLauncher from "../RoleLaucher";

export default function AppLayout() {
    const [dark, setDark] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const {i18n, t} = useTranslation();
    const user = useAppStore((s) => s.user);

    const toggleTheme = () => {
        const newTheme = dark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        setDark(!dark);
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const changeLang = () => {
        const newLang = i18n.language === "en" ? "pt" : "en";
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        const header = document.querySelector(".header");
        const handleScroll = () => {
            if (window.scrollY > 40) header?.classList.add("shrink");
            else header?.classList.remove("shrink");
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="app">
            {/* HEADER */}
            <header className="header">
                <div className="header-inner">
                    <div className="brand">
                        <FaShip size={32} color="#4fa3ff"/>
                        <h1>ThPA Port Management</h1>
                    </div>

                    <div className="header-right">
                        {/* Lang Switch */}
                        <span className="lang-switch" onClick={changeLang}>
              {i18n.language === "en" ? "EN | PT" : "PT | EN"}
            </span>

                        {/* Theme Switch */}
                        <button
                            onClick={toggleTheme}
                            className="theme-btn"
                            title={dark ? t("layout.light") : t("layout.dark")}
                        >
                            {dark ? (
                                <FaSun size={20} className="theme-icon rotate"/>
                            ) : (
                                <FaMoon size={20} className="theme-icon"/>
                            )}
                        </button>

                        {/* Role badge */}
                        {user?.role && (
                            <span
                                className={`role-badge ${
                                    user?.role
                                        ? (() => {
                                            switch (user.role) {
                                                case Roles.Administrator:
                                                    return "role-badge--admin";
                                                case Roles.PortAuthorityOfficer:
                                                    return "role-badge--officer";
                                                case Roles.LogisticsOperator:
                                                    return "role-badge--logistics";
                                                case Roles.ShippingAgentRepresentative:
                                                    return "role-badge--agent";
                                                case Roles.ProjectManager:
                                                    return "role-badge--manager";
                                                default:
                                                    return "role-badge--unknown";
                                            }
                                        })()
                                        : "role-badge--none"
                                }`}
                                title={user?.role ?? "Non Authorized"}
                            >
                        {user?.role ?? "Non Authorized"}
                        </span>
                        )}

                        <RoleLauncher/>
                        {/* Mobile Menu */}
                        <button className="menu-btn" onClick={toggleMenu} title="Menu">
                            {menuOpen ? <FaTimes size={22}/> : <FaBars size={22}/>}
                        </button>
                    </div>
                </div>
            </header>

            {/* SIDEBAR */}
            <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
                <div onClick={toggleMenu}>
                    <Nav/>
                </div>
            </aside>

            {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

            {/* MAIN */}
            <main className="content">
                <Outlet/>
            </main>

            {/* FOOTER */}
            <footer className="footer">
                © 2025 ThPA S.A. — Smart Port Operations Platform
            </footer>
        </div>
    );
}