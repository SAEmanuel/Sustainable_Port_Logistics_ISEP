import api from "../../../services/api";
import type { Role, User } from "../../../app/types";


export async function getUsers(): Promise<User[]> {
    const res = await api.get("/api/User");
    return res.data;
}

export async function getNotEliminatedUsers(): Promise<User[]> {
    const res = await api.get("/api/User/NotEliminated");
    return res.data;
}

export async function getNonAuthorizedUsers(): Promise<User[]> {
    const res = await api.get("/api/User/NonAuthorized");
    return res.data;
}

export async function getUserById(id: string): Promise<User> {
    const res = await api.get(`/api/User/${id}`);
    return res.data;
}

export async function getUserByEmail(email: string): Promise<User> {
    const res = await api.get(`/api/User/email/${encodeURIComponent(email)}`);
    return res.data;
}


export async function toggleUserStatus(id: string): Promise<User> {
    const res = await api.put(`/api/User/toggle/${id}`);
    return res.data;
}

export async function changeUserRole(id: string, role: Role): Promise<User> {
    const res = await api.put(`/api/User/changeRole/${id}`, null, {
        params: { role },
    });
    return res.data;
}


export async function activateUser(email: string): Promise<string> {
    const res = await api.put(`/api/User/activate`, null, {
        params: { email },
    });
    return res.data;
}


export async function eliminateUser(email: string): Promise<string> {
    const res = await api.put(`/api/User/eliminate`, null, {
        params: { email },
    });
    return res.data;
}