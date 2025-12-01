using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies
{
    public class PrivacyPolicy: Entity<PrivacyPolicyId> ,IAggregateRoot
    {
        public int Version { get; set; }
        
        public string TitleEn {get; set;}
        public string TitlePT {get; set;}
        
        public string ContentEn {get; set;}
        public string ContentPT {get; set;}
        
        public ClockTime CreatedAt {get; set;}
        public ClockTime EffectiveFrom {get; set;}
        public bool IsCurrent {get; set;}
        public string CreatedByAdmin {get; set;}
        
        
        private PrivacyPolicy (){ }

        public PrivacyPolicy (
            int versionIn, 
            string titleEnIn,  string titlePtIn, 
            string contentEnIn, string contentPtIn,
            ClockTime createdAt,ClockTime? effectiveFrom,string createdByAdmin)
        {
            
            this.Id = new PrivacyPolicyId(new Guid());
            this.Version = versionIn;
            this.TitleEn = titleEnIn;
            this.TitlePT = titlePtIn;
            this.ContentEn = contentEnIn;
            this.ContentPT = contentPtIn;
            this.CreatedAt = createdAt;
            this.EffectiveFrom = effectiveFrom;
            this.CreatedByAdmin = createdByAdmin;
            this.IsCurrent = true;
            
        }
            
        public void MarKAsOld()
        {
            this.IsCurrent = false;
        }

    }
}