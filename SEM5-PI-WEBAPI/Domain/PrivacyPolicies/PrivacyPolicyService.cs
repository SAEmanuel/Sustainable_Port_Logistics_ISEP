using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyService : IPrivacyPolicyService
{
    private readonly IPrivacyPolicyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public PrivacyPolicyService(IPrivacyPolicyRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<List<PrivacyPolicyDto>> GetAllPrivacyPolicies()
    {
        var listPrivacyPoliciesFromDb = await _repository.GetAllAsync();
        
        return listPrivacyPoliciesFromDb.Select( policy => PrivacyPolicyMappers.ProduceDto(policy)).ToList();
    }

    public async Task<PrivacyPolicyDto> CreatePrivacyPolicy(CreatePrivacyPolicyDto createPrivacyPolicyDto)
    {
        if (createPrivacyPolicyDto == null)
            throw new BusinessRuleValidationException("Privacy Policy DTO is null");

        var pp = PrivacyPolicyFactory.Create(createPrivacyPolicyDto);

        var exist = await _repository.GetPrivacyPolicyByVersion(pp.Version);
        if (exist != null)
            throw new BusinessRuleValidationException("Privacy Policy with this version already exist.");

        var current = await _repository.GetCurrentPrivacyPolicy();
        if (current != null)
        {
            current.MarKAsOld();
        }

        await _repository.AddAsync(pp);
        await _unitOfWork.CommitAsync();

        return PrivacyPolicyMappers.ProduceDto(pp);
    }

}