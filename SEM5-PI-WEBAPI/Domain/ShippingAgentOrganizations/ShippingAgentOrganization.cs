namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

public class ShippingAgentOrganization : Entity<ShippingAgentOrganizationId>, IAggregateRoot
{
    public ShippingOrganizationCode ShippingOrganizationCode { get; set; }
    public string LegalName { get; set; }
    public string AltName { get; set; }
    public string Address { get; set; }
    public TaxNumber Taxnumber { get; set; }

    protected ShippingAgentOrganization() { }
    
    public ShippingAgentOrganization(ShippingOrganizationCode shippingOrganizationCode,string legalName,string altName, string address, TaxNumber taxNumber)
    {
        ShippingOrganizationCode = shippingOrganizationCode;
        LegalName = legalName;
        Address = address;
        Taxnumber = taxNumber;
        AltName = altName;
        Id = new ShippingAgentOrganizationId(Guid.NewGuid());
    }


    public override bool Equals(object? obj) =>
        obj is ShippingAgentOrganization other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();

    public override string ToString() => $"{ShippingOrganizationCode}: {LegalName}: {Address}: {Taxnumber}";
}