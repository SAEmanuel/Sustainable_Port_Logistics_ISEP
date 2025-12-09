import { useAuth0 } from "@auth0/auth0-react";
import { useAppStore } from "../app/store";
import { useEffect, useRef } from "react";
import { API_WEBAPI, API_OEM } from "../config/api.ts";

export default function SyncUser() {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const setUser = useAppStore((s) => s.setUser);
    const hasSynced = useRef(false);

    useEffect(() => {
        const sync = async () => {

            if (
                !isAuthenticated ||
                !user ||
                !user.email ||
                !user.sub ||
                !user.name ||
                hasSynced.current
            ) {
                return;
            }

            hasSynced.current = true;

            try {
                const token = await getAccessTokenSilently();


                const payload = {
                    auth0UserId: user.sub,
                    email: user.email,
                    name: user.name,
                    role: null,
                    picture: user.picture,
                };

                const responseMain = await fetch(`${API_WEBAPI}/api/user/sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const userData = await responseMain.json();

                setUser({
                    id: userData.id,
                    auth0UserId: userData.auth0UserId,
                    email: userData.email,
                    name: userData.name ?? user.name,
                    picture: userData.picture ?? user.picture,
                    role: userData.role,
                    isActive: userData.isActive,
                });

                const payloadOEM = {
                    auth0UserId: payload,
                    email: user.email,
                    name: user.name,
                    role: userData.role || "NoRole",
                };

                const responseOEM = await fetch(`${API_OEM}/api/users/sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-email": user.email!,
                        "x-user-role": userData.role ?? "NoRole",
                    },
                    body: JSON.stringify(payloadOEM),
                });

                if (!responseOEM.ok) {
                    console.error("❌ Erro ao sincronizar utilizador no backend OEM");
                }

            } catch (err) {
                console.error("⚠️ Falha ao sincronizar utilizador:", err);
            }
        };

        sync();
    }, [isAuthenticated, user, getAccessTokenSilently, setUser]);

    return null;
}