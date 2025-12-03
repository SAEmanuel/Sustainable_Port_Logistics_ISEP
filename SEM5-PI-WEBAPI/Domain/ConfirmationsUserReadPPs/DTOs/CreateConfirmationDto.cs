namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs.DTOs;

public class CreateConfirmationDto
{
    public string UserEmail { get; set; }
    public string VersionPrivacyPolicy { get; set; }

    public CreateConfirmationDto(){}
}