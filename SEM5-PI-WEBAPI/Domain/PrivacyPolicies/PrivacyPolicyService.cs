using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;

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
        await SyncCurrentFlagsAsync();

        var listPrivacyPoliciesFromDb = await _repository.GetAllAsync();
        return listPrivacyPoliciesFromDb
            .Select(policy => PrivacyPolicyMappers.ProduceDto(policy))
            .ToList();
    }

    public async Task<PrivacyPolicyDto> CreatePrivacyPolicy(CreatePrivacyPolicyDto createPrivacyPolicyDto)
    {
        if (createPrivacyPolicyDto == null)
            throw new BusinessRuleValidationException("Privacy Policy DTO is null");

        var pp = PrivacyPolicyFactory.Create(createPrivacyPolicyDto);

        var exist = await _repository.GetPrivacyPolicyByVersion(pp.Version);
        if (exist != null)
            throw new BusinessRuleValidationException("Privacy Policy with this version already exist.");

        await _repository.AddAsync(pp);
        await SyncCurrentFlagsAsync();

        return PrivacyPolicyMappers.ProduceDto(pp);
    }
    
    public async Task<PrivacyPolicyDto?> GetCurrentPrivacyPolicy()
    {
        await SyncCurrentFlagsAsync();

        var ppFromDb = await _repository.GetCurrentByStatusPrivacyPolicy();
        if (ppFromDb == null)
            return null;

        return PrivacyPolicyMappers.ProduceDto(ppFromDb);
    }

    
    private async Task SyncCurrentFlagsAsync()
    {
        var nowUtc = DateTime.UtcNow;

        var all = await _repository.GetAllTrackedAsync();

        var newCurrent = await _repository.GetCurrentByTimePrivacyPolicy();

        foreach (var pp in all)
        {
            var shouldBeCurrent = newCurrent != null && pp.Id.Value.Equals(newCurrent.Id.Value);
            pp.IsCurrent = shouldBeCurrent;
        }

        await _unitOfWork.CommitAsync();
    }

}