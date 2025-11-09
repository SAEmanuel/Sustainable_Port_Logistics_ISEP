import { useAuth0 } from "@auth0/auth0-react";

export default function Profile() {
    const { user, isAuthenticated, isLoading } = useAuth0();

    if (isLoading || !isAuthenticated || !user) return null;

    // Adicionamos classes para estilização específica na sidebar
    return (
        <div className="profile-in-sidebar">
            {user.picture && (
                <img
                    src={user.picture}
                    alt={user.name}
                    width="40" // Reduzido para um look mais compacto
                    height="40"
                    referrerPolicy="no-referrer"
                />
            )}
            <div className="profile-info">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
            </div>
        </div>
    );
}