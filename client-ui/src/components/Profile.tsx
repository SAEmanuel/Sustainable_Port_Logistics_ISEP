import {useAuth0} from "@auth0/auth0-react";
import {useMemo} from "react";

export default function Profile() {
    const {user, isAuthenticated, isLoading} = useAuth0();

    const nameParts = useMemo(() => {
        if (!user?.name) return [] as string[];
        return user.name
            .split(/\s+/)
            .map((part) => part.trim())
            .filter(Boolean);
    }, [user?.name]);

    const initials = useMemo(() => {
        if (!nameParts.length) return "";
        const [first = "", second = ""] = nameParts;
        const letters = `${first.charAt(0)}${second.charAt(0)}`.trim();
        return letters.toUpperCase();
    }, [nameParts]);

    const greeting = useMemo(() => {
        if (!nameParts.length) return "";
        const firstName = user?.given_name ?? nameParts[0];
        return firstName;
    }, [nameParts, user?.given_name]);

    if (isLoading || !isAuthenticated || !user) return null;

    return (
        <div className="sidebar-profile">
            <div className="sidebar-profile__avatar" aria-hidden={!user.picture}>
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name ?? "User avatar"}
                        width="60"
                        height="60"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            <div className="sidebar-profile__details">
                {greeting && (
                    <span className="sidebar-profile__greeting">
                        {greeting.length > 12 ? greeting : `Hello, ${greeting}!`}
                    </span>
                )}
                <h3>{user.name}</h3>
                {user.email && <p>{user.email}</p>}
            </div>
        </div>
    );
}