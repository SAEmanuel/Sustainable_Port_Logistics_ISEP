import { Navigate } from "react-router-dom";
import { useAppStore } from "../app/store";
import { useAuth0 } from "@auth0/auth0-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth0();
    const user = useAppStore((s) => s.user);

    if (isLoading) return null;

    if (!isAuthenticated) return <Navigate to="/" replace />;


    if (!user?.role) {
        return <Navigate to="/pending-approval" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}