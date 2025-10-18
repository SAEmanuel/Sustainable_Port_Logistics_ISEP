using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;

public class ShippingAgentRepresentativeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public CitizenId CitizenId { get; private set; }
    public Nationality Nationality { get; set; }
    public string Email { get; set; }
    public PhoneNumber PhoneNumber { get; set; }
    public ShippingOrganizationCode SAO { get; set; }
    public List<VvnCode> Notifs { get; set; } 
    public Status Status { get; set; }

    public ShippingAgentRepresentativeDto(Guid id, string name, CitizenId citizenId, Nationality nationality, string email, PhoneNumber phoneNumber, Status status, ShippingOrganizationCode sao, List<VvnCode> notifs)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        SAO = sao;
        Notifs = notifs;
        Id = id;
    }

    public ShippingAgentRepresentativeDto(string name, CitizenId citizenId, Nationality nationality, string email, PhoneNumber phoneNumber, Status status, ShippingOrganizationCode sao, List<VvnCode> notifs)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        SAO = sao;
        Notifs = notifs;
    }


}