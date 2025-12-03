import { Outlet } from "react-router-dom";
import {
    FaShip,
    FaSun,
    FaMoon,
    FaBars,
    FaTimes,
    FaShieldAlt, 
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

export default function AppLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { i18n, t } = useTranslation();
    const user = useAppStore((s) => s.user);

    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const isDarkMode = theme === "dark";

    // PP
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

    useEffect(() => {
        const header = document.querySelector(".header");
        const handleScroll = () => {
            if (window.scrollY > 40) header?.classList.add("shrink");
            else header?.classList.remove("shrink");
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // carregar política atual ao montar layout
    useEffect(() => {
        async function loadPrivacyPolicy() {
            try {
                const pp = await getCurrentPrivacyPolicy();
                setPrivacyPolicy(pp);
            } catch (e) {
                console.error("Erro a carregar política de privacidade", e);
            }
        }
        loadPrivacyPolicy();
    }, []);

    // carregar confirmação da PP para o utilizador atual
    useEffect(() => {
        async function loadConfirmation() {
            if (!user?.email) return; // se não há user, não faz nada

            try {
                setCheckingConfirmation(true);
                const conf = await getConfirmationByUser(user.email);
                setConfirmation(conf);
                
            } catch (e) {
                console.error("Erro a carregar confirmação de privacidade", e);
            } finally {
                setCheckingConfirmation(false);
            }
        }

        loadConfirmation();
    }, [user?.email]);

    const handleAcceptPrivacy = async () => {
        if (!user?.email) return;
        try {
            const updated = await acceptConfirmationByUser(user.email);
            setConfirmation(updated);
            setShowPrivacy(false);
        } catch (e) {
            console.error("Erro ao aceitar política de privacidade", e);
        }
    };

    const handleRejectPrivacy = async () => {
        if (!user?.email) return;
        try {
            const updated = await rejectConfirmationByUser(user.email);
            setConfirmation(updated);
            setShowPrivacy(false);
            // aqui podias, por exemplo, fazer logout ou mostrar aviso
            // tipo: "Não pode usar a plataforma sem aceitar a política."
        } catch (e) {
            console.error("Erro ao rejeitar política de privacidade", e);
        }
    };

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
                        {/* Aviso de Política de Privacidade pendente */}
                        {confirmation && !confirmation.isAccepted && (
                            <button
                                type="button"
                                className="pp-notification-btn"
                                onClick={() => setShowPrivacy(true)}
                                title={t("layout.privacyPending", "Ação Necessária: Rever Política de Privacidade")}
                            >
                                <FaShieldAlt className="pp-notification-icon" />
                                {/* O ponto animado fica aqui dentro */}
                                <span className="pp-notification-dot" />
                            </button>
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
            {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

            {/* MAIN */}
            <main className="content">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="footer">
                <span className="footer-text">
                    © 2025 ThPA S.A. — Smart Port Operations Platform
                </span>

                {privacyPolicy && (
                    <>
                        <button
                            type="button"
                            className="footer-pp-btn"
                            onClick={() => setShowPrivacy(true)}
                        >
                            {t("layout.privacyPolicy", "Política de Privacidade")}
                        </button>

                        {showPrivacy && (
                            <div
                                className="pp-overlay"
                                onClick={() => setShowPrivacy(false)}
                            >
                                <div
                                    className="pp-modal"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h2 className="pp-title">
                                        {i18n.language.startsWith("pt")
                                            ? privacyPolicy.titlePT
                                            : privacyPolicy.titleEn}
                                    </h2>

                                    <div className="pp-content">
                                        {i18n.language.startsWith("pt")
                                            ? privacyPolicy.contentPT
                                            : privacyPolicy.contentEn}
                                    </div>

                                    {/* Se o utilizador ainda não aceitou, mostra botões de ação */}
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
                                        // Caso já esteja aceite ou não haja confirmação, apenas botão fechar
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
                    </>
                )}
            </footer>
        </div>
    );
}