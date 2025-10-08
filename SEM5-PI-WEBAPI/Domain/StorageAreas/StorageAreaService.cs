using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<StorageAreaService> _logger;
    private readonly IStorageAreaRepository _storageAreaRepository;

    public StorageAreaService(IUnitOfWork unitOfWork, ILogger<StorageAreaService> logger, IStorageAreaRepository storageAreaRepository)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _storageAreaRepository = storageAreaRepository;
    }

    public async Task<List<StorageAreaDto>> GetAllAsync()
    {
        _logger.LogInformation("Domain: Fetching all storage areas");

        var listStorageAreasInDb = await _storageAreaRepository.GetAllAsync();

        if (listStorageAreasInDb.Count == 0)
            throw new BusinessRuleValidationException("No storage areas found in database.");

        var listStorageAreasDto = listStorageAreasInDb
            .Select(StorageAreaFactory.CreateStorageAreaDto)
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

        return StorageAreaFactory.CreateStorageAreaDto(storageArea);
    }

    public async Task<StorageAreaDto> GetByNameAsync(string name)
    {
        _logger.LogInformation("Domain: Fetching Storage Area with Name = {Name}", name);

        var storageArea = await _storageAreaRepository.GetByNameAsync(name);

        if (storageArea == null)
            throw new BusinessRuleValidationException($"Storage Area with Name '{name}' not found.");

        return StorageAreaFactory.CreateStorageAreaDto(storageArea);
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


    public async Task<StorageAreaDto> CreateAsync(CreatingStorageAreaDto dto)
    {
        _logger.LogInformation("Domain: Creating new Storage Area with Name = {Name}", dto.Name);

        var existing = await _storageAreaRepository.GetByNameAsync(dto.Name);

        if (existing != null)
            throw new BusinessRuleValidationException($"Storage Area with name '{dto.Name}' already exists.");

        var listStorageAreaDockDistances = dto.DistancesToDocks
            .Select(d => new StorageAreaDockDistance(new DockCode(d.DockCode), d.DistanceKm))
            .ToList();

        var storageAreaNew = new StorageArea(
            dto.Name,
            dto.Description,
            dto.Type,
            dto.MaxBays,
            dto.MaxRows,
            dto.MaxTiers,
            listStorageAreaDockDistances
        );

        await _storageAreaRepository.AddAsync(storageAreaNew);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Domain: Storage Area created successfully with Id = {Id}, Name = {Name}", storageAreaNew.Id.AsGuid(), storageAreaNew.Name);

        return StorageAreaFactory.CreateStorageAreaDto(storageAreaNew);
    }

}
