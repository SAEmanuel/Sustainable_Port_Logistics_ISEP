using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyFactory
{
    public static PrivacyPolicy Create(CreatePrivacyPolicyDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var nowUtc = DateTime.UtcNow;
        var version = $"PP_{nowUtc:yyyyMMdd_HHmm}";

        var createdAt = new ClockTime(nowUtc);
        var effectiveFrom = new ClockTime(dto.EffectiveFrom);

        return new PrivacyPolicy(
            version,
            dto.TitleEn,
            dto.TitlePT,
            dto.ContentEn,
            dto.ContentPT,
            createdAt,
            effectiveFrom,
            dto.CreatedByAdmin
        );
    }
}