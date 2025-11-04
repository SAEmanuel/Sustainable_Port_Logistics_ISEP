import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../app/store";
import { Roles, type Role } from "../app/types";
import type {JSX} from "react";

export function RequireAuth() {
    const user = useAppStore((s) => s.user);
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
    const user = useAppStore((s) => s.user);
    if (!user) return <Navigate to="/login" replace />;

    const hasAccess = user.roles.some((r) => roles.includes(r));
    if (!hasAccess) return <Navigate to="/forbidden" replace />;

    return <Outlet />;
}


function getRedirectForRole(role: Role) {
    if (role === Roles.Administrator) return "/admin"; 
    if (role === Roles.Viewer) return "/";
    return "/dashboard";
}

export function RequireGuest({ children }: { children: JSX.Element }) {
    const user = useAppStore((s) => s.user);
    if (user) return <Navigate to={getRedirectForRole(user.roles[0])} replace />;
    return children;
}

