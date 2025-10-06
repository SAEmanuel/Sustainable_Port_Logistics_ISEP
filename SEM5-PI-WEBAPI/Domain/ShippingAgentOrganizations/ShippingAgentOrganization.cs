namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

public class ShippingAgentOrganization : Entity<ShippingAgentOrganizationId>, IAggregateRoot
{
    public string Code { get; set; }
    public string LegalName { get; private set; }
    public string AltName { get; set; }
    public string Address { get; set; }
    public TaxNumber Taxnumber { get; set; }

    protected ShippingAgentOrganization() { }
    
    public ShippingAgentOrganization(string code,string legalName,string altName, string address, TaxNumber taxNumber)
    {
        Code = code;
        LegalName = legalName;
        Address = address;
        Taxnumber = taxNumber;
        AltName = altName;
        Id = new ShippingAgentOrganizationId(Guid.NewGuid());
    }


    public override bool Equals(object? obj) =>
        obj is ShippingAgentOrganization other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();

    public void CheckCode(string code)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(code, @"^[A-Za-z0-9]{10}$"))
            throw new ArgumentException("Invalid organization code format. Expected a 10-character alphanumeric code.");
        
        Code = code;
    }



    public override string ToString() => $"{Code}: {LegalName}: {Address}: {Taxnumber}";
}