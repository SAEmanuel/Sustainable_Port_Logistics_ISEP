export interface Vessel {
    id: string;
    name: string;
    owner: string;
    imoNumber: string | { value: string };
    vesselTypeId: string | { value: string };
}


export interface CreateVesselRequest {
    imoNumber: string;
    name: string;
    owner: string;
    vesselTypeName: string;
}

export interface UpdateVesselRequest {
    name?: string;
    owner?: string;
}
