namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

public class CreatingShippingAgentOrganizationDto
{
    public string Code { get; set; }
    public string LegalName { get; private set; }
    public string AltName { get; set; }
    public string Address { get; set; }
    public TaxNumber Taxnumber { get; set; }

    public CreatingShippingAgentOrganizationDto() { }

    public CreatingShippingAgentOrganizationDto(string code,string legalName,string altName, string address, TaxNumber taxNumber)
    {
        Code = code;
        LegalName = legalName;
        Address = address;
        Taxnumber = taxNumber;
        AltName = altName;
    }
}
