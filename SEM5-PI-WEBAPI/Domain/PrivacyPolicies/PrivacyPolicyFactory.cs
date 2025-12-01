using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyFactory
{
    public static PrivacyPolicy Create(CreatePrivacyPolicyDto dto)
    {

        var nowUtc = DateTime.UtcNow;

        string version = $"PP_{nowUtc:yyyyMMdd_HHmm}";

        var createdAt = new ClockTime(nowUtc);

        return new PrivacyPolicy(
            version,
            dto.TitleEn,
            dto.TitlePT,
            dto.ContentEn,
            dto.ContentPT,
            createdAt,
            dto.EffectiveFrom,
            dto.CreatedByAdmin
        );
    }
}