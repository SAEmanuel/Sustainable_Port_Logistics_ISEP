using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyMappers
{
    public static PrivacyPolicyDto ProduceDto(PrivacyPolicy privacyPolicy)
    {
        return new PrivacyPolicyDto
        {
            Id = privacyPolicy.Id.AsGuid(),
            Version = privacyPolicy.Version,
            TitleEn = privacyPolicy.TitleEn,
            TitlePT = privacyPolicy.TitlePT,
            ContentEn = privacyPolicy.ContentEn,
            ContentPT = privacyPolicy.ContentPT,
            CreatedAt = privacyPolicy.CreatedAt,
            EffectiveFrom = privacyPolicy.EffectiveFrom,
            IsCurrent = privacyPolicy.IsCurrent,
            CreatedByAdmin = privacyPolicy.CreatedByAdmin
        };
    }
    
}