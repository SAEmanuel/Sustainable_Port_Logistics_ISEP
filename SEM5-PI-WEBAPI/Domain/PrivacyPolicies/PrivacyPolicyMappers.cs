using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public static class PrivacyPolicyMappers
{
    public static PrivacyPolicyDto ProduceDto(PrivacyPolicy policy)
    {
        return new PrivacyPolicyDto
        {
            Id = policy.Id.AsGuid(),
            Version = policy.Version,
            TitleEn = policy.TitleEn,
            TitlePT = policy.TitlePT,
            ContentEn = policy.ContentEn,
            ContentPT = policy.ContentPT,

            CreatedAt = policy.CreatedAt?.Value,
            EffectiveFrom = policy.EffectiveFrom?.Value,

            IsCurrent = policy.IsCurrent,
            CreatedByAdmin = policy.CreatedByAdmin
        };
    }
}