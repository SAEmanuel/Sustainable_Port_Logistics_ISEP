import api from "../../../services/api";
import type { Qualification, CreateQualificationRequest, UpdateQualificationRequest } from "../types/qualification";


export async function getQualifications(): Promise<Qualification[]> {
    const res = await api.get("/api/Qualifications");
    return res.data;
}

export async function getQualificationByName(name: string): Promise<Qualification> {
    const res = await api.get(`/api/Qualifications/name/${name}`);
    return res.data;
}

export async function getQualificationByCode(code: string): Promise<Qualification> {
    const res = await api.get(`/api/Qualifications/code/${code}`);
    return res.data;
}


export async function createQualification(data: CreateQualificationRequest): Promise<Qualification> {
    const res = await api.post("/api/Qualifications", data);
    return res.data;
}

export async function updateQualification(id: string, data: UpdateQualificationRequest): Promise<Qualification> {
    const res = await api.patch(`/api/Qualifications/${id}`, data);
    return res.data;
}