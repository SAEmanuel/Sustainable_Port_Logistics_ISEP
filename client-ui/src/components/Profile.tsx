import { useAuth0 } from "@auth0/auth0-react";
import { useCurrentAvatar } from "../components/hooks/useCurrentAvatar";

export default function Profile() {
    const { user, isAuthenticated, isLoading } = useAuth0();
    
    const picture = useCurrentAvatar();
    
    if (isLoading || !isAuthenticated || !user) return null;

    return (
        <div className="profile-in-sidebar">
            {picture && (
                <img
                    src={picture}
                    alt={user.name}
                    width="40"
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