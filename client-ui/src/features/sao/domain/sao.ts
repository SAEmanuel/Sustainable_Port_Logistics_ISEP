import type {
    CreateSAODTO,
} from "../dto/saoDTOs";

export type CreateSAORequest = CreateSAODTO;

import type{
    shippingOrganizationCode,
    TaxNumber
} from "../domain/valueObjects";

export interface SAO {
    shippingOrganizationCode : shippingOrganizationCode
    legalName : string 
    altName : string 
    address : string 
    taxnumber : TaxNumber
}





