using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources;

public class PhysicalResourceService : IPhysicalResourceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPhysicalResourceRepository _repo;
    private readonly IQualificationRepository _qualificationRepository;
    private readonly ILogger<PhysicalResourceService> _logger;

    public PhysicalResourceService(
        IUnitOfWork unitOfWork,
        IPhysicalResourceRepository repo,
        IQualificationRepository qualificationRepository,
        ILogger<PhysicalResourceService> logger)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _qualificationRepository = qualificationRepository;
        _logger = logger;
    }

    // =========================================================
    // GET METHODS
    // =========================================================
    public async Task<List<PhysicalResourceDTO>> GetAllAsync()
    {
        _logger.LogInformation("Business Domain: Request to fetch all Physical Resources.");

        var list = await _repo.GetAllAsync();
        var dtos = PhysicalResourceMapper.ToDtoList(list);

        _logger.LogInformation("Business Domain: Returning [{Count}] Physical Resources.", dtos.Count);
        return dtos;
    }

    public async Task<PhysicalResourceDTO> GetByIdAsync(PhysicalResourceId id)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resource with ID = {Id}", id.Value);

        var physicalResource = await _repo.GetByIdAsync(id);
        if (physicalResource == null)
        {
            _logger.LogWarning("Business Domain: No Physical Resource found with ID = {Id}", id.Value);
            throw new BusinessRuleValidationException($"No physical resource found with ID: {id.Value}.");
        }

        return PhysicalResourceMapper.ToDto(physicalResource);
    }

    public async Task<PhysicalResourceDTO> GetByCodeAsync(PhysicalResourceCode code)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resource with Code = {Code}", code.Value);

        var physicalResource = await _repo.GetByCodeAsync(code);
        if (physicalResource == null)
        {
            _logger.LogWarning("Business Domain: No Physical Resource found with Code = {Code}", code.Value);
            throw new BusinessRuleValidationException($"No physical resource found with code: {code.Value}.");
        }

        return PhysicalResourceMapper.ToDto(physicalResource);
    }

    public async Task<List<PhysicalResourceDTO>> GetByDescriptionAsync(string description)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resources with Description = {Description}", description);

        var physicalResources = await _repo.GetByDescriptionAsync(description);
        if (physicalResources == null || !physicalResources.Any())
            throw new BusinessRuleValidationException($"No physical resource found with description: {description}.");

        return PhysicalResourceMapper.ToDtoList(physicalResources);
    }

    public async Task<List<PhysicalResourceDTO>> GetByQualificationAsync(QualificationId qualification)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resources by Qualification ID = {Qualification}", qualification.Value);

        var exists = await _qualificationRepository.ExistQualificationID(qualification);
        if (!exists)
            throw new BusinessRuleValidationException($"Qualification {qualification.Value} not found.");

        var physicalResources = await _repo.GetByQualificationAsync(qualification);
        if (physicalResources == null || !physicalResources.Any())
            throw new BusinessRuleValidationException($"No physical resources found with qualification {qualification.Value}.");

        return PhysicalResourceMapper.ToDtoList(physicalResources);
    }

    public async Task<List<PhysicalResourceDTO>> GetByTypeAsync(PhysicalResourceType type)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resources with Type = {Type}", type);

        var resources = await _repo.GetByTypeAsync(type);
        if (resources == null || !resources.Any())
            throw new BusinessRuleValidationException($"No physical resources found with type: {type}.");

        return PhysicalResourceMapper.ToDtoList(resources);
    }

    public async Task<List<PhysicalResourceDTO>> GetByStatusAsync(PhysicalResourceStatus status)
    {
        _logger.LogInformation("Business Domain: Request to fetch Physical Resources with Status = {Status}", status);

        var resources = await _repo.GetByStatusAsync(status);
        if (resources == null || !resources.Any())
            throw new BusinessRuleValidationException($"No physical resources found with status: {status}.");

        return PhysicalResourceMapper.ToDtoList(resources);
    }

    public async Task<List<PhysicalResourceDTO>> GetByPartialCodeAsync(string partialCode)
            {
                var list = await _repo.SearchByPartialCodeAsync(partialCode);

                if (list == null || list.Count == 0)
                {
                    return new List<PhysicalResourceDTO>();
                }

                return PhysicalResourceMapper.ToDtoList(list);
            }

            public async Task<List<PhysicalResourceDTO>> GetByPartialDescriptionAsync(string partialDescription)
            {
                var list = await _repo.SearchByPartialDescriptionAsync(partialDescription);

                if (list == null || list.Count == 0)
                {
                    return new List<PhysicalResourceDTO>();
                }

                return PhysicalResourceMapper.ToDtoList(list);
            }

    // =========================================================
    // CREATE
    // =========================================================
    public async Task<PhysicalResourceDTO> AddAsync(CreatingPhysicalResourceDto dto)
    {
        _logger.LogInformation("Business Domain: Request to add new Physical Resource with Description = {Description}", dto.Description);
        
        if (dto.OperationalCapacity == null)
            throw new BusinessRuleValidationException("Operational capacity must be provided.");
        if (dto.SetupTime == null)
            throw new BusinessRuleValidationException("Setup time must be provided.");
        if (dto.PhysicalResourceType == null)
            throw new BusinessRuleValidationException("Physical resource type must be provided.");

        QualificationId? qualificationId = null;
        if (!string.IsNullOrWhiteSpace(dto.QualificationCode))
        {
            qualificationId = await CheckQualificationIdAsync(dto.QualificationCode);
            _logger.LogInformation("Business Domain: Qualification Code = {Code} validated successfully.", dto.QualificationCode);
        }
        
        var code = await GenerateCodeAsync(dto.PhysicalResourceType.Value);

        var resource = new EntityPhysicalResource(
            code,
            dto.Description,
            dto.OperationalCapacity.Value,
            dto.SetupTime.Value,
            dto.PhysicalResourceType.Value,
            qualificationId
        );

        await _repo.AddAsync(resource);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Business Domain: Physical Resource created successfully with Code = {Code}", code.Value);
        return PhysicalResourceMapper.ToDto(resource);
    }

    // =========================================================
    // UPDATE
    // =========================================================
    public async Task<PhysicalResourceDTO> UpdateAsync(PhysicalResourceId id, UpdatingPhysicalResource dto)
    {
        _logger.LogInformation("Business Domain: Request to update Physical Resource with ID = {Id}", id.Value);

        var resource = await _repo.GetByIdAsync(id);
        if (resource == null)
        {
            _logger.LogWarning("Business Domain: Physical Resource not found for ID = {Id}", id.Value);
            return null;
        }

        if (dto.Description != null)
            resource.UpdateDescription(dto.Description);

        if (dto.OperationalCapacity != null)
            resource.UpdateOperationalCapacity(dto.OperationalCapacity.Value);

        if (dto.SetupTime != null)
            resource.UpdateSetupTime(dto.SetupTime.Value);

        if (dto.QualificationId != null)
        {
            var qid = new QualificationId(dto.QualificationId.Value);
            var exists = await _qualificationRepository.ExistQualificationID(qid);
            if (!exists)
                throw new BusinessRuleValidationException("Qualification ID not found.");

            resource.UpdateQualification(qid);
        }

        await _unitOfWork.CommitAsync();
        _logger.LogInformation("Business Domain: Physical Resource with ID = {Id} updated successfully.", id.Value);
        return PhysicalResourceMapper.ToDto(resource);
    }

    // =========================================================
    // DEACTIVATE / REACTIVATE
    // =========================================================
    public async Task<PhysicalResourceDTO> DeactivationAsync(PhysicalResourceId id)
    {
        var resource = await _repo.GetByIdAsync(id);
        if (resource == null)
            return null;

        if (resource.Status == PhysicalResourceStatus.Unavailable)
            throw new BusinessRuleValidationException("The physical resource is already deactivated.");

        resource.UpdateStatus(PhysicalResourceStatus.Unavailable);
        await _unitOfWork.CommitAsync();

        return PhysicalResourceMapper.ToDto(resource);
    }

    public async Task<PhysicalResourceDTO> ReactivationAsync(PhysicalResourceId id)
    {
        var resource = await _repo.GetByIdAsync(id);
        if (resource == null)
            return null;

        if (resource.Status == PhysicalResourceStatus.Available)
            throw new BusinessRuleValidationException("The physical resource is already active.");

        resource.UpdateStatus(PhysicalResourceStatus.Available);
        await _unitOfWork.CommitAsync();

        return PhysicalResourceMapper.ToDto(resource);
    }

    // =========================================================
    // AUXILIARY METHODS
    // =========================================================
    
    private async Task<QualificationId> CheckQualificationIdAsync(string qfCode)
    {
        var exist = await _qualificationRepository.GetQualificationByCodeAsync(qfCode);
        if (exist == null)
            throw new BusinessRuleValidationException($"Qualification Code {qfCode} does not exist in DB.");

        return exist.Id;
    }

    private async Task<PhysicalResourceCode> GenerateCodeAsync(PhysicalResourceType type)
    {
        var count = await _repo.CountByTypeAsync(type);
        var prefix = type.ToString().Length > 5 ? type.ToString().Substring(0, 5).ToUpper() : type.ToString().ToUpper();
        var code = $"{prefix}-{(count + 1):D4}";
        return new PhysicalResourceCode(code);
    }
}
