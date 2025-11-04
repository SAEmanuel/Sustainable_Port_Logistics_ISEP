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

function getRouteForRole(role: Role) {
    const map: Record<Role, string> = {
        [Roles.Administrator]: "/vessels",
        [Roles.LogisticsOperator]: "/logistics-dashboard",
        [Roles.PortAuthorityOfficer]: "/vvn",
        [Roles.ShippingAgentRepresentative]: "/vvn",
        [Roles.Viewer]: "/",
    };
    return map[role] ?? "/";
}

export function RequireGuest({ children }: { children: JSX.Element }) {
    const user = useAppStore((s) => s.user);

    if (user) {
        const redirect = getRouteForRole(user.roles[0]);
        return <Navigate to={redirect} replace />;
    }

    return children;
}
