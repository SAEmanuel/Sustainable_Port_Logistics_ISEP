import api from "../../../services/api";
import type { Vessel, CreateVesselRequest, UpdateVesselRequest } from "../types/vessel";

export async function getVessels(): Promise<Vessel[]> {
    const res = await api.get("/api/Vessel");
    return res.data;
}

export async function getVesselById(id: string): Promise<Vessel> {
    const res = await api.get(`/api/Vessel/id/${id}`);
    return res.data;
}

export async function getVesselByIMO(imo: string): Promise<Vessel> {
    const res = await api.get(`/api/Vessel/imo/${imo}`);
    return res.data;
}

export async function getVesselByOwner(owner: string): Promise<Vessel[]> {
    const res = await api.get(`/api/Vessel/owner/${owner}`);
    return res.data;
}

export async function createVessel(data: CreateVesselRequest): Promise<Vessel> {
    const res = await api.post("/api/Vessel", data);
    return res.data;
}

export async function patchVesselByIMO(imo: string, data: UpdateVesselRequest): Promise<Vessel> {
    const res = await api.patch(`/api/Vessel/imo/${imo}`, data);
    return res.data;
}
