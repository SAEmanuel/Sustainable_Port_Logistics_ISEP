import type{
    shippingOrganizationCode,
    TaxNumber
} from "../domain/valueObjects";

export interface saoDTO {
    shippingOrganizationCode : shippingOrganizationCode
    legalName : string 
    altName : string 
    address : string 
    taxnumber : TaxNumber
}

export interface CreateSAODTO {
   legalName : string 
   altName : string  
   address : string  
   taxnumber : string  
}