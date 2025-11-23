import type { saoDTO } from "../dto/saoDTOs";
import type { SAO } from "../domain/sao";

export function mapSAODto(dto: saoDTO): SAO {
    return {
        shippingOrganizationCode : dto.shippingOrganizationCode,
        legalName : dto.legalName ,
        altName : dto.altName, 
        address : dto.address ,
        taxnumber : dto.taxnumber
    };
}
