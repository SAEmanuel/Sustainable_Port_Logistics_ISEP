import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaUsers } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import "../style/user.css";

import { getUsers, getNonAuthorizedUsers, getUserByEmail } from "../service/userService";
import type { User } from "../../../app/types";

import UserSearch from "../components/UserSearch";
import UserDetails from "../components/UserDetails";

/* ===============================
 * PAGE COMPONENT
 * =============================== */

function UserManagementPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadAllUsers();
    }, []);

    const loadAllUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setError(err as Error);
            toast.error(t("users.errors.loadAll"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: "all" | "email" | "noRole", value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            let data: User[] = [];
            switch (type) {
                case "email": {
                    const user = await getUserByEmail(value);
                    data = user ? [user] : [];
                    break;
                }
                case "noRole":
                    data = await getNonAuthorizedUsers();
                    break;
                case "all":
                default:
                    await loadAllUsers();
                    return;
            }
            setUsers(data);
        } catch (err) {
            setError(err as Error);
            toast.error(t("users.errors.search"));
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const userStats = useMemo(() => {
        const total = users.length;
        const withRole = users.filter(u => u.role).length;
        const withoutRole = users.filter(u => !u.role).length;
        const active = users.filter(u => u.isActive).length;
        return { total, withRole, withoutRole, active };
    }, [users]);

    const handleShowDetails = (user: User) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedUser(null);
        loadAllUsers();
    };

    return (
        <div className="user-page-container">
            {/* HEADER */}
            <div className="user-header">
                <Link to="/dashboard" className="user-back-button" title={t("users.actions.backToDashboard")}>
                    ‹
                </Link>
                <h1>
                    <FaUsers className="user-icon" /> {t("users.title")}
                </h1>
            </div>

            {/* STATS */}
            <div className="user-controls-container">
                <div className="user-stats-grid">
                    <div className="user-stat-card total">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{userStats.total}</span>
                        <span className="stat-title">{t("users.stats.total")}</span>
                    </div>
                    <div className="user-stat-card active">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{userStats.active}</span>
                        <span className="stat-title">{t("users.stats.active")}</span>
                    </div>
                    <div className="user-stat-card with-role">
                        <span className="stat-icon">🧩</span>
                        <span className="stat-value">{userStats.withRole}</span>
                        <span className="stat-title">{t("users.stats.withRole")}</span>
                    </div>
                    <div className="user-stat-card without-role">
                        <span className="stat-icon">⚠️</span>
                        <span className="stat-value">{userStats.withoutRole}</span>
                        <span className="stat-title">{t("users.stats.withoutRole")}</span>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="user-action-box">
                    <UserSearch onSearch={handleSearch} />
                </div>
            </div>

            {/* TABLE */}
            {isLoading && <p>{t("users.loading")}</p>}
            {error && <p className="error-message">{error.message}</p>}

            <table className="user-table">
                <thead>
                <tr>
                    <th>{t("users.fields.name")}</th>
                    <th>{t("users.fields.email")}</th>
                    <th>{t("users.fields.role")}</th>
                    <th>{t("users.fields.status")}</th>
                    <th>{t("users.fields.actions")}</th>
                </tr>
                </thead>
                <tbody>
                {users.map((u) => (
                    <tr key={u.id}>
                        <td>{u.name ?? "—"}</td>
                        <td>{u.email}</td>
                        <td>{u.role ?? t("users.roles.none")}</td>
                        <td className={u.isActive ? "active-status" : "inactive-status"}>
                            {u.isActive ? t("users.status.active") : t("users.status.inactive")}
                        </td>
                        <td>
                            <button
                                className="user-details-btn"
                                onClick={() => handleShowDetails(u)}
                            >
                                {t("users.actions.view")}
                            </button>
                        </td>
                    </tr>
                ))}
                {users.length === 0 && (
                    <tr>
                        <td colSpan={5} className="empty-table">
                            {t("users.empty")}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* MODAL */}
            {selectedUser && (
                <UserDetails
                    user={selectedUser}
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                />
            )}
        </div>
    );
}

export default UserManagementPage;