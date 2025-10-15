namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;

public class UpdatingShippingAgentRepresentativeDto
{

    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Status? Status { get; set; }

    public UpdatingShippingAgentRepresentativeDto() { }
    public UpdatingShippingAgentRepresentativeDto( string email, string phoneNumber, Status status)
    {
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
    }
}