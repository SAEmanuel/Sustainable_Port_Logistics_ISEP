using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyFactory
{
    public static PrivacyPolicy Create(CreatePrivacyPolicyDto dto,int versionIn)
    {
        return new PrivacyPolicy(versionIn,dto.TitleEn,dto.TitlePT,dto.ContentEn,dto.ContentPT,new ClockTime(DateTime.Now),dto.EffectiveFrom,dto.CreatedByAdmin);
    }
}