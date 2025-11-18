export interface SAO {
    shippingOrganizationCode : shippingOrganizationCode
    legalName : string 
    altName : string 
    address : string 
    taxnumber : TaxNumber
}

export interface shippingOrganizationCode{
    value : string
}

export interface TaxNumber{
    value : string
}


export interface CreateSAORequest {
   shippingOrganizationCode : string
   legalName : string 
   altName : string  
   address : string  
   taxnumber : string  
}

