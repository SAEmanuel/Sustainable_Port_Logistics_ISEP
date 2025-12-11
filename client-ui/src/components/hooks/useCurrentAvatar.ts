import { useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppStore } from "../../app/store";

export const useCurrentAvatar = () => {
    const { user: authUser } = useAuth0(); // Dados do Auth0
    const { user } = useAppStore(); // Dados do teu Backend (Zustand)

    const avatar = useMemo(() => {
        // 1. Prioridade: Imagem do Backend
        if (user?.picture) {
            // Se já for um URL (http...) ou já tiver o cabeçalho data:image, usa direto
            if (user.picture.startsWith("http") || user.picture.startsWith("data:")) {
                return user.picture;
            }
            // Caso contrário, é a string Base64 crua do C#, adicionamos o cabeçalho
            return `data:image/png;base64,${user.picture}`;
        }

        // 2. Prioridade: Imagem do Auth0 (Fallback)
        if (authUser?.picture) {
            return authUser.picture;
        }

        // 3. Sem imagem
        return "";
    }, [user, authUser]);

    return avatar;
};