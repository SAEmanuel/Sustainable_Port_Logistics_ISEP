import { useAuth0 } from "@auth0/auth0-react";
import { useAppStore } from "../app/store";
import { useEffect, useRef } from "react";

export default function SyncUser() {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const setUser = useAppStore((s) => s.setUser);
    const hasSynced = useRef(false);

    useEffect(() => {
        const sync = async () => {
            if (!isAuthenticated || !user || hasSynced.current) return;
            hasSynced.current = true;

            try {
                const token = await getAccessTokenSilently();

                const payload = {
                    Auth0UserId: user.sub,
                    Email: user.email,
                    Name: user.name,
                    Role: null,
                    Picture: user.picture,
                };

                const response = await fetch("http://localhost:5008/api/user/sync", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    console.error("❌ Erro ao sincronizar utilizador:", response.statusText);
                    return;
                }

                const userData = await response.json();
                setUser({
                    id: userData.id,
                    auth0UserId: userData.auth0UserId,
                    email: userData.email,
                    name: userData.name ?? user.name,
                    picture: userData.picture ?? user.picture,
                    role: userData.role,
                    isActive: userData.isActive,
                });
            } catch (err) {
                console.error("⚠️ Falha ao sincronizar utilizador:", err);
            }
        };

        sync();
    }, [isAuthenticated, user, getAccessTokenSilently, setUser]);

    return null;
}