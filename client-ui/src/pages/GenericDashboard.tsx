// src/pages/GenericDashboard.tsx
import {type JSX, useEffect, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import {useAppStore} from "../app/store";
import {Roles, type Role} from "../app/types";
import {useTranslation} from "react-i18next";
import {
    FaUserAlt, FaIdBadge, FaEnvelope, FaSignInAlt, FaClock,
    FaUsers, FaCogs, FaCertificate, FaUniversity, FaShip,
    // FaBell,
    FaPlus, FaLink, FaRoute
} from "react-icons/fa";
import "./css/genericDashboard.css";

/* ================================
 * Constantes & Utilitários
 * ================================ */

const roleColor: Record<Role, string> = {
    [Roles.Administrator]: "#e63946",
    [Roles.PortAuthorityOfficer]: "#4361ee",
    [Roles.LogisticsOperator]: "#f3722c",
    [Roles.ShippingAgentRepresentative]: "#2a9d8f",
    [Roles.Viewer]: "#6c757d",
};

const routeIcon: Record<string, JSX.Element> = {
    "/vvn": <FaUniversity size={48} />,
    "/qualifications": <FaCertificate size={48} />,
    "/staff-members": <FaUsers size={48} />,
    "/physical-resources": <FaCogs size={48} />,
    "/vessels": <FaShip size={48} />,
};

type LinkItem = { label: string; path: string; color?: string; icon?: JSX.Element };

function roleLabel(t: (k: string) => string, role: Role) {
    const map: Partial<Record<Role, string>> = {
        [Roles.Administrator]: t("roles.administrator"),
        [Roles.PortAuthorityOfficer]: t("roles.officer"),
        [Roles.LogisticsOperator]: t("roles.operator"),
        [Roles.ShippingAgentRepresentative]: t("roles.agent"),
        [Roles.Viewer]: t("roles.viewer"),
    };
    return map[role] ?? role;
}

/** enter key para cards “clicáveis” */
function onKeyActivate(e: React.KeyboardEvent, fn: () => void) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
    }
}

/* ================================
 * Mapeamento dinâmico de links por role
 * ================================ */
function useAccessibleLinksByRole(t: (k: string) => string, roles: Role[]): LinkItem[] {
    return useMemo(() => {
        if (!roles?.length) return [];

        const isAdmin = roles.includes(Roles.Administrator);
        if (isAdmin) return []; // admin terá dashboard próprio

        const isOp = roles.includes(Roles.LogisticsOperator);

        const links: LinkItem[] = [
            {
                label: t("menu.vvn"),
                path: "/vvn",
                color: "#764ba2",
                icon: routeIcon["/vvn"] ?? <FaRoute size={48} />,
            },
        ];

        if (isOp) {
            links.push(
                {
                    label: t("menu.qualifications"),
                    path: "/qualifications",
                    color: "#4361ee",
                    icon: routeIcon["/qualifications"] ?? <FaCertificate size={48} />,
                },
                {
                    label: t("dashboard.physicalResources") || t("dashboard.physicalResources"),
                    path: "/physical-resources",
                    color: "#f3722c",
                    icon: routeIcon["/physical-resources"] ?? <FaCogs size={48} />,
                },
                {
                    label: t("menu.staffMembers") || t("dashboard.staffMembers"),
                    path: "/staff-members",
                    color: "#2a9d8f",
                    icon: routeIcon["/staff-members"] ?? <FaUsers size={48} />,
                },
            );
        }

        // remove duplicados por path
        const dedup = new Map(links.map(l => [l.path, l]));
        return Array.from(dedup.values());
    }, [roles, t]);
}

/* ================================
 * Componente
 * ================================ */
export default function GenericDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useAppStore((s) => s.user);

    const email = (user as any)?.email ?? `${user?.id ?? "user"}@example.com`;

    // persiste "last_login_at" uma única vez por sessão
    useEffect(() => {
        const last = localStorage.getItem("last_login_at");
        if (!last) localStorage.setItem("last_login_at", new Date().toISOString());
    }, []);
    const lastLogin = localStorage.getItem("last_login_at");

    const links = useAccessibleLinksByRole(t, user?.roles ?? []);
    

    const recent = [
        { id: "a1", title: t("dashboard.recent.updatedQualification"), time: "10m" },
        { id: "a2", title: t("dashboard.recent.newStaffMember"), time: "2h" },
        { id: "a3", title: t("dashboard.recent.resourceMaintenance"), time: t("dashboard.time.yesterday", "yesterday") },
    ];

    const quick = [
        { label: t("dashboard.quick.addStaff"), icon: <FaPlus />, to: "/staff-members?new=1" },
        { label: t("dashboard.quick.createQualification"), icon: <FaPlus />, to: "/qualifications?new=1" },
        { label: t("dashboard.quick.addResource"), icon: <FaPlus />, to: "/physical-resources?new=1" },
        { label: t("dashboard.quick.openVVN"), icon: <FaLink />, to: "/vvn" },
    ];

    return (
        <div className="gd-container">
            {/* Banner / Avisos */}
            {/*<div className="gd-banner" role="status" aria-live="polite">*/}
            {/*    <div className="gd-banner-icon" aria-hidden><FaBell /></div>*/}
            {/*    <div className="gd-banner-body">*/}
            {/*        <strong>{t("dashboard.announcement.title")}</strong>*/}
            {/*        <span>{t("dashboard.announcement.body")}</span>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Cabeçalho do utilizador */}
            <header className="gd-header">
                {/* ESQUERDA: avatar + nome */}
                <div className="gd-user-left">
                    <div className="gd-avatar" aria-hidden>
                        {(user?.name ?? "U").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <div>
                        <h1 className="gd-greeting">
                            {t("dashboard.welcomeUser", { name: user?.name ?? t("dashboard.user") })}
                        </h1>
                        <p className="gd-sub">{t("dashboard.subtitle")}</p>
                    </div>
                </div>

                {/* DIREITA: tiles de informação */}
                <div className="gd-info-grid">
                    <div className="gd-info">
                        <div className="gd-info-label"><FaEnvelope aria-hidden /> Email</div>
                        <div className="gd-info-value">{email}</div>
                    </div>

                    <div className="gd-info">
                        <div className="gd-info-label"><FaIdBadge aria-hidden /> {t("dashboard.userId")}</div>
                        <div className="gd-info-value">{user?.id}</div>
                    </div>

                    <div className="gd-info">
                        <div className="gd-info-label"><FaSignInAlt aria-hidden /> {t("dashboard.lastLogin")}</div>
                        <div className="gd-info-value">
                            {lastLogin ? new Date(lastLogin).toLocaleString() : t("dashboard.justNow")}
                        </div>
                    </div>

                    <div className="gd-info gd-info-roles">
                        <div className="gd-info-label"><FaUserAlt aria-hidden /> {t("dashboard.roles")}</div>
                        <div className="gd-roles-badges">
                            {(user?.roles ?? []).map((r) => (
                                <span key={r} className="gd-role-badge" style={{ backgroundColor: roleColor[r] }}>
            {roleLabel(t, r)}
          </span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>


            {/* Cards dinâmicos (baseados nos roles) */}
            <section className="gd-grid" aria-label="Available modules">
                {links.map(link => (
                    <div
                        key={link.path}
                        className="gd-card"
                        tabIndex={0}
                        role="button"
                        aria-label={`${link.label}. ${t("dashboard.clickToOpen")}`}
                        onClick={() => navigate(link.path)}
                        onKeyDown={(e) => onKeyActivate(e, () => navigate(link.path))}
                        style={{ "--card-color": link.color ?? "#667eea" } as React.CSSProperties}
                    >
                        <div className="gd-card-icon" style={{ color: link.color ?? "#667eea" }}>
                            {link.icon ?? <FaRoute size={48} />}
                        </div>
                        <h3 className="gd-card-title">{link.label}</h3>
                        <p className="gd-card-desc">{t("dashboard.clickToOpen")}</p>
                        <div className="gd-card-arrow" aria-hidden>→</div>
                    </div>
                ))}
                {links.length === 0 && (
                    <div className="gd-empty" role="note">
                        {t("dashboard.noModules")}
                    </div>
                )}
            </section>

            {/* Recentes + Ações rápidas */}
            <section className="gd-bottom">
                <div className="gd-recent">
                    <h4>{t("dashboard.recentActivity")}</h4>
                    <ul>
                        {recent.map((r) => (
                            <li key={r.id}>
                                <span className="gd-dot" />
                                <span className="gd-recent-title">{r.title}</span>
                                <span className="gd-recent-time"><FaClock aria-hidden /> {r.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="gd-quick">
                    <h4>{t("dashboard.quickActions")}</h4>
                    <div className="gd-quick-grid">
                        {quick.map((q) => (
                            <button
                                key={q.label}
                                className="gd-quick-btn"
                                onClick={() => navigate(q.to)}
                                type="button"
                            >
                                <span className="gd-quick-icon">{q.icon}</span>
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
