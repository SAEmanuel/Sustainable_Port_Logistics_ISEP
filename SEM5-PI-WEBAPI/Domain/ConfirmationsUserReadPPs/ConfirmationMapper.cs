using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

public class ConfirmationMapper
{

    public ConfirmationDto MapConfirmationToDto(ConfirmationPrivacyPolicy pp)
    {
        return new ConfirmationDto {
            Id = pp.Id.AsGuid(),
            UserEmail = pp.UserEmail,
            VersionPrivacyPolicy = pp.VersionPrivacyPolicy,
            IsAcceptedPrivacyPolicy =  pp.IsAcceptedPrivacyPolicy,
            AcceptedAtTime = pp.AcceptedAtTime,
        };
    }
    
}