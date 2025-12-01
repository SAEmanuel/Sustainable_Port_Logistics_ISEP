using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public interface IPrivacyPolicyService
{
    Task<List<PrivacyPolicyDto>> GetAllPrivacyPolicies();
    Task<PrivacyPolicyDto> CreatePrivacyPolicy(CreatePrivacyPolicyDto createPrivacyPolicyDto);
    Task<PrivacyPolicyDto?> GetCurrentPrivacyPolicy();
}