using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public interface IPrivacyPolicyRepository : IRepository<PrivacyPolicy, PrivacyPolicyId>
{
    Task<PrivacyPolicy?> GetPrivacyPolicyByVersion(string version);
    Task<PrivacyPolicy?> GetCurrentPrivacyPolicy();
}