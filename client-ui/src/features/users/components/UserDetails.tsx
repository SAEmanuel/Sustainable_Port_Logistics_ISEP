import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAppStore } from "../../../app/store";
import type { User } from "../../../app/types";
import { changeUserRole, toggleUserStatus } from "../service/userService";
import "../style/user.css";

interface UserDetailsProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserDetails({ user, isOpen, onClose }: UserDetailsProps) {
    const { t } = useTranslation();
    const storeUser = useAppStore((s) => s.user);

    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User>(user);
    const [selectedRole, setSelectedRole] = useState(user.role ?? "");
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const isSelf = storeUser?.id === user.id;

    useEffect(() => {
        if (isOpen && user) {
            setCurrentUser(user);
            setSelectedRole(user.role ?? "");
            setIsAnimatingOut(false);
        }
    }, [user, isOpen]);

    const handleRoleChange = async () => {
        if (isSelf) {
            toast.error(t("users.errors.cannotEditSelf"));
            return;
        }
        if (!selectedRole || !user.id) {
            toast.error(t("users.errors.noRoleSelected"));
            return;
        }
        setIsLoading(true);
        try {
            const updated = await changeUserRole(user.id, selectedRole);
            setCurrentUser(updated);
            toast.success(t("users.success.roleChanged"));
        } catch {
            toast.error(t("users.errors.roleChangeFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (isSelf) {
            toast.error(t("users.errors.cannotEditSelf"));
            return;
        }
        if (!user.id) return;
        setIsLoading(true);
        try {
            const updated = await toggleUserStatus(user.id);
            setCurrentUser(updated);
            toast.success(
                updated.isActive
                    ? t("users.success.activated")
                    : t("users.success.deactivated")
            );
        } catch {
            toast.error(t("users.errors.toggleFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 300);
    };

    if (!isOpen && !isAnimatingOut) return null;

    const isActive = currentUser.isActive ?? false;
    const displayName = currentUser.name || t("users.unknown");
    const email = currentUser.email || "—";
    const picture = currentUser.picture || "";

    return (
        <div className={`user-modal-overlay ${isAnimatingOut ? "anim-out" : ""}`}>
            <div className={`user-modal-content ${isAnimatingOut ? "anim-out" : ""}`}>
                {/* ===== HEADER ===== */}
                <div className="user-details-header">
                    <div className="user-avatar-wrapper">
                        {picture ? (
                            <img
                                src={picture}
                                alt={displayName}
                                className="user-avatar"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        ) : (
                            <div className="user-avatar-placeholder">
                                {(displayName || "U")
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="user-details-name">{displayName}</h2>
                        <p className="user-details-email">{email}</p>
                    </div>
                </div>

                {/* ===== INFO GRID ===== */}
                <div className="user-details-grid">
                    <div className="user-info-card">
                        <div className="user-info-label">{t("users.fields.id")}</div>
                        <div className="user-info-value">{currentUser.id ?? "—"}</div>
                    </div>

                    <div className="user-info-card">
                        <div className="user-info-label">{t("users.fields.auth0UserId")}</div>
                        <div className="user-info-value">{currentUser.auth0UserId ?? "—"}</div>
                    </div>

                    <div className="user-info-card">
                        <div className="user-info-label">{t("users.fields.status")}</div>
                        <div className={`user-status-pill ${isActive ? "active" : "inactive"}`}>
                            {isActive ? t("users.status.active") : t("users.status.inactive")}
                        </div>
                    </div>

                    <div className="user-info-card">
                        <div className="user-info-label">{t("users.fields.role")}</div>
                        <select
                            className="user-role-select"
                            value={selectedRole ?? ""}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            disabled={isLoading || isSelf}
                        >
                            <option value="">{t("roles.none")}</option>
                            <option value="Administrator">{t("roles.administrator")}</option>
                            <option value="LogisticsOperator">{t("roles.operator")}</option>
                            <option value="PortAuthorityOfficer">{t("roles.officer")}</option>
                            <option value="ShippingAgentRepresentative">
                                {t("roles.agent")}
                            </option>
                            <option value="ProjectManager">{t("roles.projectManager")}</option>
                        </select>
                    </div>
                </div>

                {/* ===== ACTIONS ===== */}
                <div className="user-modal-actions">
                    <button
                        className="user-save-role-btn"
                        onClick={handleRoleChange}
                        disabled={isLoading || isSelf}
                    >
                        {t("users.actions.saveRole")}
                    </button>

                    <button
                        className={`user-toggle-btn ${isActive ? "deactivate" : "activate"}`}
                        onClick={handleToggleStatus}
                        disabled={isLoading || isSelf}
                    >
                        {isActive
                            ? t("users.actions.deactivate")
                            : t("users.actions.activate")}
                    </button>

                    <button
                        className="user-cancel-btn"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {t("users.actions.close")}
                    </button>
                </div>

                {isSelf && (
                    <p className="user-self-warning">⚠️ {t("users.errors.cannotEditSelf")}</p>
                )}
            </div>
        </div>
    );
}