import api from "../../../services/api";
import type { SAO, CreateSAORequest } from "../domain/sao";
import type { CreateSAODTO, saoDTO } from "../dto/saoDTOs";


export async function getSAOs(): Promise<saoDTO[]> {
    const res = await api.get("/api/ShippingAgentOrganization");
    return res.data;
}

export async function getByCode(code: string): Promise<saoDTO> {
    const res = await api.get(`/api/ShippingAgentOrganization/code/${code}`);
    return res.data;
}

export async function getByLegalName(legalName: string): Promise<saoDTO> {
    const res = await api.get(`/api/ShippingAgentOrganization/legalName/${legalName}`);
    return res.data;
}

export async function getByTaxNumber(taxnumber: string): Promise<saoDTO> {
    const res = await api.get(`/api/ShippingAgentOrganization/taxnumber/${taxnumber}`);
    return res.data;
}

export async function createSAO(data: CreateSAODTO): Promise<saoDTO> {
    const res = await api.post("/api/ShippingAgentOrganization", data);
    return res.data;
}

export async function deleteSAO(legalName: string): Promise<void> {
    await api.delete(`/api/ShippingAgentOrganization/legalName/${legalName}`);
}
