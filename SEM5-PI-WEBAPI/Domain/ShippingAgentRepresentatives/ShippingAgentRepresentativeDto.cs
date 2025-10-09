namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public class ShippingAgentRepresentativeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string CitizenId { get; private set; }
    public string Nationality { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public Status Status { get; set; }

    public ShippingAgentRepresentativeDto(Guid id, string name, string citizenId, string nationality, string email, string phoneNumber, Status status)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        Id = id;
    }
}