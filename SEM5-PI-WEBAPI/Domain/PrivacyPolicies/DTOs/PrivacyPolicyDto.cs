// PrivacyPolicyDto
using System;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

public class PrivacyPolicyDto
{
    public Guid Id { get; set; }
    public string Version { get; set; } = default!;
        
    public string TitleEn { get; set; } = default!;
    public string TitlePT { get; set; } = default!;
        
    public string ContentEn { get; set; } = default!;
    public string ContentPT { get; set; } = default!;
        
    public DateTime? CreatedAt { get; set; }      // pode vir null se quiseres
    public DateTime? EffectiveFrom { get; set; }  // opcional

    public bool IsCurrent { get; set; }
    public string CreatedByAdmin { get; set; } = default!;

    public PrivacyPolicyDto() { }
}