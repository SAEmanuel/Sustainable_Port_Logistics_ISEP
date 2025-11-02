import api from "../../../services/api";
import type { VesselType, CreateVesselTypeRequest, UpdateVesselTypeRequest } from "../types/vesselType";

export async function getVesselTypes(): Promise<VesselType[]> {
    const res = await api.get("/api/VesselType");
    return res.data;
}

export async function getVesselTypesByID(id: string): Promise<VesselType> {
    const res = await api.get(`/api/VesselType/id/${id}`);
    return res.data;
}

export async function getVesselTypesByName(name: string): Promise<VesselType> {
    const res = await api.get(`/api/VesselType/name/${name}`);
    return res.data;
}


export async function createVesselType(data: CreateVesselTypeRequest): Promise<VesselType> {
    const res = await api.post("/api/VesselType", data);
    return res.data;
}

export async function updateVesselType(id: string, data: UpdateVesselTypeRequest): Promise<VesselType> {
    const res = await api.put(`/api/VesselType/${id}`, data);
    return res.data;
}

export async function deleteVesselType(id: string): Promise<void> {
    await api.delete(`/api/VesselType/${id}`);
}
