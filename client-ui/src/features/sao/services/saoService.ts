import api from "../../../services/api";
import type { SAO, TaxNumber, CreateSAORequest } from "../types/sao";

export async function getSAOs(): Promise<SAO[]> {
    const res = await api.get("/api/ShippingAgentOrganization");
    return res.data;
}

export async function getById(id: string): Promise<SAO> {
    const res = await api.get(`/api/ShippingAgentOrganization/${id}`);
    return res.data;
}

export async function getByCode(code: string): Promise<SAO> {
    const res = await api.get(`/api/ShippingAgentOrganization/code/${code}`);
    return res.data;
}

export async function getByLegalName(legalName: string): Promise<SAO> {
    const res = await api.get(`/api/ShippingAgentOrganization/legalName/${legalName}`);
    return res.data;
}

export async function getByTaxNumber(taxnumber: TaxNumber): Promise<SAO> {
    const res = await api.get(`/api/ShippingAgentOrganization/taxnumber/${taxnumber}`);
    return res.data;
}

export async function createSAO(data: CreateSAORequest): Promise<SAO> {
    const res = await api.post("/api/ShippingAgentOrganization", data);
    return res.data;
}
