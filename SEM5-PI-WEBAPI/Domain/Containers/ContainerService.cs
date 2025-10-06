using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;

namespace SEM5_PI_WEBAPI.Domain.Containers;

public class ContainerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ContainerService> _logger;
    private readonly IContainerRepository _containerRepository;

    public ContainerService(IUnitOfWork unitOfWork, ILogger<ContainerService> logger,
        IContainerRepository containerRepository)
    {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
        this._containerRepository = containerRepository;

    }
    
    public async Task<List<ContainerDto>> GetAllAsync()
    {
        _logger.LogInformation("Business Domain: Request to fetch all Containers.");
            
        var listContainerInDb = await _containerRepository.GetAllAsync();
            
        if (listContainerInDb.Count == 0) throw new BusinessRuleValidationException("No Vessel/s where found on DB.");
        
        _logger.LogInformation("Business Domain: Found [{Count}] Containers in database.", listContainerInDb.Count);

        var listContainerDto = listContainerInDb
            .Select(instance => ContainerFactory.CreateContainerDto(instance))
            .ToList();
            
        _logger.LogInformation("Business Domain: Returning [{Count}] Containers DTOs.", listContainerDto.Count);

        return listContainerDto;
    }
    
    public async Task<ContainerDto> GetByIdAsync(ContainerId id)
    {
        _logger.LogInformation("Business Domain: Request to fetch Container with ID = {Id}", id.Value);

        var containerInDb = await _containerRepository.GetByIdAsync(id);

        if (containerInDb == null)
            throw new BusinessRuleValidationException($"No Container Found with ID : {id.Value}");
       
        _logger.LogInformation("Business Domain: Container with ID = {Id} found successfully.", id.Value);
    
        return ContainerFactory.CreateContainerDto(containerInDb);
    }
    
    public async Task<ContainerDto> CreateAsync(CreatingContainerDto creatingContainerDto)
    {
        _logger.LogInformation("Business Domain: Request to add new Container with ISO Code = {ISO}", creatingContainerDto.IsoCode);

        var imo = new Iso6346Code(creatingContainerDto.IsoCode);
        var isoExist = await _containerRepository.GetByIsoNumberAsync(imo);
        
        if (isoExist != null) throw new BusinessRuleValidationException($"Container with ISO Code '{creatingContainerDto.IsoCode}' already exists on DB.");
        
        
        EntityContainer createdContainer = ContainerFactory.CreateEntityContainer(creatingContainerDto);
            
        await _containerRepository.AddAsync(createdContainer);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Business Domain: Container Created Successfully with Iso Code [{ISO}] and System ID [{ID}].",createdContainer.ISOId, createdContainer.Id);

        return ContainerFactory.CreateContainerDto(createdContainer);
    }

    public async Task<ContainerDto> GetByIsoAsync(string id)
    {
        Iso6346Code inId = new  Iso6346Code(id);

        _logger.LogInformation("Business Domain: Request to fetch Container with ISO Number = {Id}", inId);

        EntityContainer? containerOnDb = await _containerRepository.GetByIsoNumberAsync(inId);
        
        if(containerOnDb == null)
            throw new BusinessRuleValidationException($"No Container Found with ID : {inId}");
            
        _logger.LogInformation("Business Domain: Container with ISO Number = {Id} found successfully.", inId);

        return ContainerFactory.CreateContainerDto(containerOnDb);
            
    }

    public async Task<ContainerDto> PatchByIsoAsync(string iso, UpdatingContainerDto dto)
    {
        var isoNumber = new Iso6346Code(iso);

        var container = await _containerRepository.GetByIsoNumberAsync(isoNumber);

        if (container == null)
            throw new BusinessRuleValidationException($"No Container found with ISO {isoNumber}.");

        if (!string.IsNullOrWhiteSpace(dto.Description))
            container.UpdateDescription(dto.Description);

        if (dto.Type != null)
            container.UpdateType(dto.Type.Value);
    
        if (dto.Status != null)
            container.UpdateStatus(dto.Status.Value);
    
        if (dto.WeightKg != null)
            container.UpdateWeightKg(dto.WeightKg.Value);

        await _unitOfWork.CommitAsync();

        return ContainerFactory.CreateContainerDto(container);
    }


}