using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs.DTOs;

public class ConfirmationDto
{
    public Guid Id { get; set; }
    public string UserEmail { get; set; }
    public string VersionPrivacyPolicy { get; set; }
    
    public bool IsAcceptedPrivacyPolicy { get; set; }
    public ClockTime? AcceptedAtTime { get; set; }

    public ConfirmationDto(){}
}