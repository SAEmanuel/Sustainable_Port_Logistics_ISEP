using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs.DTOs;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

public class ConfirmationFactory
{
    public ConfirmationPrivacyPolicy ProduceConfirmation(CreateConfirmationDto dto)
    {
        return new ConfirmationPrivacyPolicy(dto.UserEmail, dto.VersionPrivacyPolicy);
    }
}