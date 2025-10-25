using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaService: IStorageAreaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<StorageAreaService> _logger;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly IDockRepository  _dockRepository;

    public StorageAreaService(IUnitOfWork unitOfWork, ILogger<StorageAreaService> logger, 
        IStorageAreaRepository storageAreaRepository, IPhysicalResourceRepository physicalResourceRepository, IDockRepository dockRepository)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _storageAreaRepository = storageAreaRepository;
        _physicalResourceRepository = physicalResourceRepository;
        _dockRepository = dockRepository;
    }

    public async Task<List<StorageAreaDto>> GetAllAsync()
    {
        _logger.LogInformation("Domain: Fetching all storage areas");

        var listStorageAreasInDb = await _storageAreaRepository.GetAllAsync();
        

        var listStorageAreasDto = listStorageAreasInDb
            .Select(StorageAreaMapper.CreateStorageAreaDto)
            .ToList();

        _logger.LogInformation("Domain: Returning {Count} storage areas", listStorageAreasDto.Count);
        return listStorageAreasDto;
    }

    public async Task<StorageAreaDto> GetByIdAsync(StorageAreaId id)
    {
        _logger.LogInformation("Domain: Fetching Storage Area with ID = {Id}", id.Value);

        var storageArea = await _storageAreaRepository.GetByIdAsync(id);

        if (storageArea == null)
            throw new BusinessRuleValidationException($"Storage Area with ID {id.Value} not found.");

        return StorageAreaMapper.CreateStorageAreaDto(storageArea);
    }

    public async Task<StorageAreaDto> GetByNameAsync(string name)
    {
        _logger.LogInformation("Domain: Fetching Storage Area with Name = {Name}", name);

        var storageArea = await _storageAreaRepository.GetByNameAsync(name);

        if (storageArea == null)
            throw new BusinessRuleValidationException($"Storage Area with Name '{name}' not found.");

        return StorageAreaMapper.CreateStorageAreaDto(storageArea);
    }

    public async Task<List<StorageAreaDockDistanceDto>> GetDistancesToDockAsync(string? name, StorageAreaId? id)
    {
        _logger.LogInformation("Domain: Fetching distances for Storage Area ({Criteria})", name != null ? $"Name = {name}" : $"Id = {id?.Value}");

        StorageArea? storageArea = null;

        if (!string.IsNullOrWhiteSpace(name))
        {
            storageArea = await _storageAreaRepository.GetByNameAsync(name);
        }
        else if (id != null)
        {
            storageArea = await _storageAreaRepository.GetByIdAsync(id);
        }

        if (storageArea == null)
            throw new BusinessRuleValidationException("Storage Area not found.");

        var distances = storageArea.DistancesToDocks
            .Select(d => new StorageAreaDockDistanceDto(d.Dock.Value, d.Distance))
            .ToList();

        _logger.LogInformation("Domain: Returning {Count} distances for Storage Area", distances.Count);
        return distances;
    }

    public async Task<List<string>> GetPhysicalResourcesAsync(string? name, StorageAreaId? id)
    {
        _logger.LogInformation("Domain: Fetching physical resources for Storage Area ({Criteria})", name != null ? $"Name = {name}" : $"Id = {id?.Value}");

        StorageArea? storageArea = null;

        if (!string.IsNullOrWhiteSpace(name))
        {
            storageArea = await _storageAreaRepository.GetByNameAsync(name);
        }
        else if (id != null)
        {
            storageArea = await _storageAreaRepository.GetByIdAsync(id);
        }
        
        if (storageArea == null)
            throw new BusinessRuleValidationException("Storage Area not found.");

        var pr = storageArea.PhysicalResources
            .Select(d => d.Value)
            .ToList();

        _logger.LogInformation("Domain: Returning {Count} physical resources for Storage Area", pr.Count);
        return pr;
    }


    public async Task<StorageAreaDto> CreateAsync(CreatingStorageAreaDto dto)
    {
        _logger.LogInformation("Domain: Creating new Storage Area with Name = {Name}", dto.Name);

        var existingSa = await _storageAreaRepository.GetByNameAsync(dto.Name);
        
        if (existingSa != null)
            throw new BusinessRuleValidationException($"Storage Area with name '{dto.Name}' already exists.");

        foreach (var dock in dto.DistancesToDocks)
        {
            var dockInDb = await _dockRepository.GetByCodeAsync(new DockCode(dock.DockCode));
            if (dockInDb == null) throw new BusinessRuleValidationException($"Dock code '{dock.DockCode}' does not exist in DB.");
            
        }
        
        foreach (string pr in dto.PhysicalResources)
        {
            var exist = await _physicalResourceRepository.GetByCodeAsync(new PhysicalResourceCode(pr));
            if (exist == null)
                throw new BusinessRuleValidationException(
                    $"Physical Resource with code '{pr}' does not exist in the database."
                );
        }

        var storageAreaNew = StorageAreaFactory.CreateStorageArea(dto);

        await _storageAreaRepository.AddAsync(storageAreaNew);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Domain: Storage Area created successfully with Id = {Id}, Name = {Name}", storageAreaNew.Id.AsGuid(), storageAreaNew.Name);

        return StorageAreaMapper.CreateStorageAreaDto(storageAreaNew);
    }




}
