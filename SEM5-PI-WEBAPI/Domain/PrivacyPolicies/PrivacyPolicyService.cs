using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyService : IPrivacyPolicyService
{
    private readonly IPrivacyPolicyRepository _repository;

    public PrivacyPolicyService(IPrivacyPolicyRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<List<PrivacyPolicyDto>> GetAllPrivacyPolicies()
    {
        var listPrivacyPoliciesFromDb = await _repository.GetAllAsync();
        
        return listPrivacyPoliciesFromDb.Select( policy => PrivacyPolicyMappers.ProduceDto(policy)).ToList();
    }
}