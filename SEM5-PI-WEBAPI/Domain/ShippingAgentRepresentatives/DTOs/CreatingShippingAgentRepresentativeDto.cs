using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;

public class CreatingShippingAgentRepresentativeDto
{
    public string Name { get; set; }
    public CitizenId CitizenId { get; set; }
    public Nationality Nationality { get; set; }
    public string Email { get; set; }
    public PhoneNumber PhoneNumber { get; set; }
    public string Status { get; set; }
    public string Sao { get; set; }
    
    public CreatingShippingAgentRepresentativeDto() { }
    
    public CreatingShippingAgentRepresentativeDto(string name, CitizenId citizenId, Nationality nationality, string email, PhoneNumber phoneNumber, string status, string sao)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        Sao = sao;
    }


}
