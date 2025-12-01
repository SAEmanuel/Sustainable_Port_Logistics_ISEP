using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

public class CreatePrivacyPolicyDto
{
        
    public string TitleEn {get; set;}
    public string TitlePT {get; set;}
        
    public string ContentEn {get; set;}
    public string ContentPT {get; set;}
        
    public ClockTime EffectiveFrom {get; set;}
    public string CreatedByAdmin {get; set;}
    
    private CreatePrivacyPolicyDto() { }
}