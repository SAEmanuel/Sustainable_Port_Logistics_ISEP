import { useAuth0 } from "@auth0/auth0-react";

export default function Profile() {
    const { user, isAuthenticated, isLoading } = useAuth0();

    if (isLoading || !isAuthenticated || !user) return null;

    return (
        <div>
            {user.picture && (
                <img
                    src={user.picture}
                    alt={user.name}
                    width="60"
                    height="60"
                    referrerPolicy="no-referrer"
                />
            )}
            <h3>{user.name}</h3>
            <p>{user.email}</p>
        </div>
    );
}