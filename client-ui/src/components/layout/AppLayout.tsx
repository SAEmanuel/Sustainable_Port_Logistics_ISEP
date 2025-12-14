import { Outlet } from "react-router-dom";
import {
    FaShip,
    FaSun,
    FaMoon,
    FaBars,
    FaTimes,
    FaShieldAlt,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
} from "react-icons/fa";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Nav from "./Nav";
import "./layout.css";
import { useAppStore } from "../../app/store";
import { Roles } from "../../app/types";
import RoleLauncher from "../RoleLaucher";

import type { PrivacyPolicy } from "../../features/privatePolicy/domain/privacyPolicy";
import type { Confirmation } from "../../features/privatePolicy/domain/confirmation";
import {
    getCurrentPrivacyPolicy,
    getConfirmationByUser,
    acceptConfirmationByUser,
    rejectConfirmationByUser,
} from "../../features/privatePolicy/services/privacyPolicyService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom"; 
export default function AppLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { i18n, t } = useTranslation();
    const user = useAppStore((s) => s.user);

    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const isDarkMode = theme === "dark";

    // Política de Privacidade atual
    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(null);
    const [showPrivacy, setShowPrivacy] = useState(false);

    // Confirmação da PP do utilizador
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [checkingConfirmation, setCheckingConfirmation] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const changeLang = () => {
        const newLang = i18n.language === "en" ? "pt" : "en";
        i18n.changeLanguage(newLang);
    };

    // Efeito de shrink no header ao fazer scroll
    useEffect(() => {
        const header = document.querySelector(".header");
        const handleScroll = () => {
            if (window.scrollY > 40) header?.classList.add("shrink");
            else header?.classList.remove("shrink");
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Carregar política de privacidade atual
    useEffect(() => {
        async function loadPrivacyPolicy() {
            try {
                const pp = await getCurrentPrivacyPolicy();
                setPrivacyPolicy(pp);
            } catch (e) {
                console.error("Erro ao carregar política de privacidade", e);
            }
        }
        loadPrivacyPolicy();
    }, []);

// Carregar confirmação da PP para o utilizador atual
    useEffect(() => {
        async function loadConfirmation() {
            if (!user?.email) return;

            // 1. Iniciar Loading e guardar o ID
            const loadingId = toast.loading(t("common.loading", "A verificar estado da política..."));

            try {
                setCheckingConfirmation(true);

                // 2. Atraso forçado de 5 segundos
                await new Promise((resolve) => setTimeout(resolve, 2000));

                const conf = await getConfirmationByUser(user.email);
                setConfirmation(conf);

                // 3. Remover o Loading
                toast.dismiss(loadingId);

                // 4. Se não estiver aceite, mostrar o alerta
                if (!conf.isAccepted) {
                    toast(t("privacyUpdate.toast", "Importante: A Política de Privacidade foi alterada."), {
                        icon: '⚠️',
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }

            } catch (e) {
                console.error("Erro ao carregar confirmação de privacidade", e);
                toast.dismiss(loadingId);
            } finally {
                setCheckingConfirmation(false);
            }
        }

        loadConfirmation();
    }, [user?.email, t]); // Adiciona 't' às dependências

    // Aceitar PP
    const handleAcceptPrivacy = async () => {
        if (!user?.email) return;
        try {
            const updated = await acceptConfirmationByUser(user.email);
            setConfirmation(updated); // isAccepted -> true
            setShowPrivacy(false);
        } catch (e) {
            console.error("Erro ao aceitar política de privacidade", e);
        }
    };

    // Rejeitar PP
    const handleRejectPrivacy = async () => {
        if (!user?.email) return;
        try {
            const updated = await rejectConfirmationByUser(user.email);
            setConfirmation(updated);
            setShowPrivacy(false);
            // aqui podes forçar logout ou bloquear navegação, se quiseres
        } catch (e) {
            console.error("Erro ao rejeitar política de privacidade", e);
        }
    };

    return (
        <div className="app">
            {/* HEADER */}
            <header className="header">
                <div className="header-inner">
                    <div className="brand" style={{ marginBottom: "10px" }}>
                        <FaShip size={24} color="#4fa3ff" />
                        <h3 className="footer-brand-title">ThPA Management</h3>
                    </div>

                    <div className="header-right">
                        
                        {/* Botão de notificação da Política de Privacidade */}
                        {confirmation && (
                            <div className="pp-status-wrapper">
                                <button
                                    type="button"
                                    className={
                                        confirmation.isAccepted
                                            ? "pp-notification-btn pp-notification-btn--ok"
                                            : "pp-notification-btn"
                                    }
                                    onClick={() => setShowPrivacy(true)}
                                    title={
                                        confirmation.isAccepted
                                            ? t(
                                                "layout.privacyAccepted",
                                                "Política de Privacidade aceite. Clique para rever."
                                            )
                                            : t(
                                                "layout.privacyPending",
                                                "Ação necessária: rever e aceitar a Política de Privacidade."
                                            )
                                    }
                                >
                                    <FaShieldAlt
                                        className={
                                            confirmation.isAccepted
                                                ? "pp-notification-icon pp-notification-icon--ok"
                                                : "pp-notification-icon"
                                        }
                                    />
                                    {/* Ponto vermelho pulsante só se ainda não estiver aceite */}
                                    {!confirmation.isAccepted && (
                                        <span className="pp-notification-dot" />
                                    )}
                                </button>

                                {/* Tooltip textual quando já está aceite */}
                                {confirmation.isAccepted && (
                                    <span className="pp-status-tooltip">
                                        {t(
                                            "layout.privacyAcceptedTooltip",
                                            "Política de Privacidade aceite. Clique para consultar."
                                        )}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Lang Switch */}
                        <span className="lang-switch" onClick={changeLang}>
                            {i18n.language === "en" ? "EN | PT" : "PT | EN"}
                        </span>

                        {/* Theme Switch */}
                        <button
                            onClick={toggleTheme}
                            className="theme-btn"
                            title={isDarkMode ? t("layout.light") : t("layout.dark")}
                        >
                            {isDarkMode ? (
                                <FaSun size={20} className="theme-icon rotate" />
                            ) : (
                                <FaMoon size={20} className="theme-icon" />
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
                                                case Roles.PortOperationsSupervisor:
                                                    return "role-badge--supervisor";
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

                        <RoleLauncher />

                        {/* Mobile Menu */}
                        <button className="menu-btn" onClick={toggleMenu} title="Menu">
                            {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* SIDEBAR */}
            <Nav isOpen={menuOpen} />

            {/* OVERLAY para fechar o menu em mobile */}
            {menuOpen && <div className="overlay" onClick={toggleMenu} />}

            {/* MAIN */}
            <main className="content">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="footer">
                <div className="footer-container">

                    {/* Coluna 1: Sobre / Marca */}
                    <div className="footer-col">
                        <div className="brand" style={{ marginBottom: "10px" }}>
                            <FaShip size={24} color="#4fa3ff" />
                            <h3 className="footer-brand-title">ThPA Management</h3>
                        </div>

                        <p className="footer-desc">
                            {t(
                                "footer.desc",
                                "Plataforma integrada para gestão portuária inteligente, otimização logística e controlo de operações marítimas."
                            )}
                        </p>
                        <div className="system-status">
                            <span className="status-dot"></span>
                            {t("footer.systemOperational", "Todos os sistemas operacionais")}
                        </div>
                    </div>

                    {/* Coluna 2: Navegação / Acesso Rápido */}
                    <div className="footer-col">
                        <h4 className="footer-heading">
                            {t("footer.navigation", "Navegação")}
                        </h4>
                        <ul className="footer-links">
                            <li>
                                <a href="#" className="footer-link">
                                    {t("nav.dashboard", "Dashboard")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="footer-link">
                                    {t("nav.operations", "Operações")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="footer-link">
                                    {t("nav.schedule", "Escalas")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="footer-link">
                                    {t("nav.reports", "Relatórios")}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Coluna 3: Contactos / Suporte */}
                    <div className="footer-col">
                        <h4 className="footer-heading">
                            {t("footer.contact", "Suporte Operacional")}
                        </h4>
                        <div className="contact-item">
                            <FaMapMarkerAlt className="contact-icon" />
                            <span>
                                Terminal de Contentores, Edifício 4
                                <br />
                                4450-000, Leixões, Portugal
                            </span>
                        </div>
                        <div className="contact-item">
                            <FaPhoneAlt className="contact-icon" />
                            <span>+351 220 000 000</span>
                        </div>
                        <div className="contact-item">
                            <FaEnvelope className="contact-icon" />
                            <span>suporte@thpa.pt</span>
                        </div>
                    </div>

                    {/* Coluna 4: Legal / Versão */}
                    <div className="footer-col">
                        <h4 className="footer-heading">
                            {t("footer.legal", "Legal & Versão")}
                        </h4>
                        <ul className="footer-links">
                            {privacyPolicy && (
                                <li>
                                    <button
                                        type="button"
                                        className="footer-link"
                                        onClick={() => setShowPrivacy(true)}
                                    >
                                        {t(
                                            "layout.privacyPolicy",
                                            "Política de Privacidade"
                                        )}
                                    </button>
                                </li>
                            )}
                            <li>
                                <a href="https://www.thpa.gr/terms-of-use/?utm_source=chatgpt.com" className="footer-link">
                                    {t("footer.terms", "Termos de Serviço")}
                                </a>
                            </li>
                            <li>
                                <Link to="/datarights" className="footer-link">
                                    {t("footer.datarigths", "Direitos de Dados")}
                                </Link>
                            </li>
                            <li
                                style={{
                                    marginTop: "10px",
                                    fontSize: "0.8rem",
                                    opacity: 0.5,
                                }}
                            >
                                v2.4.0-stable (Build 2025)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Barra Inferior */}
                <div className="footer-bottom">
                    <span>
                        © 2025 ThPA S.A. — Smart Port Operations Platform. All rights
                        reserved.
                    </span>

                    {/* Modal da Política de Privacidade */}
                    {showPrivacy && privacyPolicy && (
                        <div
                            className="pp-overlay"
                            onClick={() => setShowPrivacy(false)}
                        >
                            <div
                                className="pp-modal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h4 className="pp-title">
                                    Title : {i18n.language.startsWith("pt")
                                        ? privacyPolicy.titlePT
                                        : privacyPolicy.titleEn}
                                </h4>
                                
                                <h2 className="pp-title">
                                    Version : {privacyPolicy.version}
                                </h2>
               

                                <div className="pp-content">
                                    {i18n.language.startsWith("pt")
                                        ? privacyPolicy.contentPT
                                        : privacyPolicy.contentEn}
                                </div>

                                {confirmation && !confirmation.isAccepted ? (
                                    <div className="pp-actions">
                                        <button
                                            type="button"
                                            className="pp-accept-btn"
                                            onClick={handleAcceptPrivacy}
                                            disabled={checkingConfirmation}
                                        >
                                            {t("layout.acceptPrivacy", "Aceitar")}
                                        </button>
                                        <button
                                            type="button"
                                            className="pp-reject-btn"
                                            onClick={handleRejectPrivacy}
                                            disabled={checkingConfirmation}
                                        >
                                            {t("layout.rejectPrivacy", "Rejeitar")}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="pp-close-btn"
                                        onClick={() => setShowPrivacy(false)}
                                    >
                                        {t("common.close", "Fechar")}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}
