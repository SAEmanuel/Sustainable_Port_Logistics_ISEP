using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

public class PrivacyPolicyDto
{
    public Guid Id { get; set; }
    public string Version { get; set; }
        
    public string TitleEn {get; set;}
    public string TitlePT {get; set;}
        
    public string ContentEn {get; set;}
    public string ContentPT {get; set;}
        
    public ClockTime CreatedAt {get; set;}
    public ClockTime EffectiveFrom {get; set;}
    public bool IsCurrent {get; set;}
    public string CreatedByAdmin {get; set;}


    public PrivacyPolicyDto() { }
    
}