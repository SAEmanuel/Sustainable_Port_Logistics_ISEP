using System;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

public class CreatePrivacyPolicyDto
{
    public string TitleEn { get; set; } = default!;
    public string TitlePT { get; set; } = default!;
        
    public string ContentEn { get; set; } = default!;
    public string ContentPT { get; set; } = default!;
        
    public DateTime EffectiveFrom { get; set; }

    public string CreatedByAdmin { get; set; } = default!;

    public CreatePrivacyPolicyDto() { }
}