using SEM5_PI_WEBAPI.Domain.Shared;
namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public enum Status
{
    activated,
    deactivated
}

public class ShippingAgentRepresentative : Entity<ShippingAgentRepresentativeId>, IAggregateRoot
{
    public string Name { get; set; }
    public string CitizenId { get; private set; }
    public string Nationality { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }

    public Status Status { get; set; }



    public ShippingAgentRepresentative(string name, string citizenId, string nationality, string email, string phoneNumber,Status status)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        Id = new ShippingAgentRepresentativeId(Guid.NewGuid());
    }



    public override bool Equals(object? obj) =>
        obj is ShippingAgentRepresentative other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();


    public override string ToString() => $"{Name}: {CitizenId}: {Nationality}: {Email}: {PhoneNumber}";
}