import api from "./api";
import { useAppStore } from "../app/store";
import { z } from "zod";

const MeSchema = z.object({
    id: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
});

export async function fetchMe() {
    const { data } = await api.get("/api/me/role"); // ajeita para o teu endpoint
    const parsed = MeSchema.parse(data);
    useAppStore.getState().setUser({ ...parsed, roles: parsed.roles as any });
}

export function loginDev(token: string) {
    // placeholder para testar; depois trocamos por OIDC
    localStorage.setItem("access_token", token);
    return fetchMe();
}

export function logout() {
    localStorage.removeItem("access_token");
    useAppStore.getState().setUser(null);
}
