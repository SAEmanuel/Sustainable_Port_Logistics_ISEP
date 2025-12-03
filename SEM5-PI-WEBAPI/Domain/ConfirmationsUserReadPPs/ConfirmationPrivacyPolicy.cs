using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

public class ConfirmationPrivacyPolicy : Entity<ConfirmationPrivacyPolicyId>, IAggregateRoot
{
    public string UserEmail { get; private set; }
    public string VersionPrivacyPolicy { get; private set; }
    
    public bool IsAcceptedPrivacyPolicy { get; private set; }
    public ClockTime? AcceptedAtTime { get; private set; }
    
    
    private ConfirmationPrivacyPolicy() { }

    public ConfirmationPrivacyPolicy(string userEmail, string versionPrivacyPolicy)
    {
        this.Id = new ConfirmationPrivacyPolicyId(Guid.NewGuid());
        this.UserEmail = userEmail;
        this.VersionPrivacyPolicy = versionPrivacyPolicy;
        this.IsAcceptedPrivacyPolicy = false;
        this.AcceptedAtTime = null;
    }


    public bool IsAccepted() { return IsAcceptedPrivacyPolicy; }

    public bool Accept(string version)
    {
        this.VersionPrivacyPolicy = version;
        this.IsAcceptedPrivacyPolicy = true;
        this.AcceptedAtTime = new ClockTime(DateTime.UtcNow);

        return IsAcceptedPrivacyPolicy;
    }

    public bool Decline(string version)
    {
        this.VersionPrivacyPolicy = version;
        this.IsAcceptedPrivacyPolicy = false;
        this.AcceptedAtTime = null;
        
        return IsAcceptedPrivacyPolicy;
    }
    
}