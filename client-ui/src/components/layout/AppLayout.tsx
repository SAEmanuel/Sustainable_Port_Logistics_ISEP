import { Outlet, Link } from "react-router-dom";
import { FaShip, FaSun, FaMoon, FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./layout.css";

export default function AppLayout() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { i18n } = useTranslation();

  // Alternar tema (escuro/claro)
  const toggleTheme = () => {
    const newTheme = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    setDark(!dark);
  };

  // Abrir/fechar menu lateral
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Alternar idioma (PT ↔ EN)
  const changeLang = () => {
    const newLang = i18n.language === "en" ? "pt" : "en";
    i18n.changeLanguage(newLang);
  };

  // Efeito "Shrink" no header ao fazer scroll
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
            <FaShip size={32} color="#4fa3ff" />
            <h1>ThPA Port Management</h1>
          </div>

          <div className="header-right">
            <span className="lang-switch" onClick={changeLang}>
              {i18n.language === "en" ? "EN | PT" : "PT | EN"}
            </span>

            <button
              onClick={toggleTheme}
              className="theme-btn"
              title={dark ? "Modo claro" : "Modo escuro"}
            >
              {dark ? (
                <FaSun size={22} className="theme-icon rotate" />
              ) : (
                <FaMoon size={22} className="theme-icon" />
              )}
            </button>

            <FaUserCircle
              size={26}
              className="login-icon"
              title="Login"
              onClick={() => alert("Abrir modal de login futuramente")}
            />

            <button className="menu-btn" onClick={toggleMenu} title="Menu">
              {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <nav>
          <ul>
            <li><Link to="/" onClick={toggleMenu}>Início</Link></li>
            <li><Link to="/vvn" onClick={toggleMenu}>VVNs</Link></li>
            <li><Link to="/storage-areas" onClick={toggleMenu}>Storage Areas</Link></li>
            <li><Link to="/admin" onClick={toggleMenu}>Administração</Link></li>
            <li><Link to="/login" onClick={toggleMenu}>Login</Link></li>
          </ul>
        </nav>
      </aside>

      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="content">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer">
        © 2025 ThPA S.A. — Smart Port Operations Platform
      </footer>
    </div>
  );
}
