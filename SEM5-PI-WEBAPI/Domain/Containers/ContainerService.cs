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
    private readonly IVesselRepository _vesselRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;

    public ContainerService(IUnitOfWork unitOfWork, ILogger<ContainerService> logger,
        IContainerRepository containerRepository, IVesselRepository vesselRepository, IStorageAreaRepository storageAreaRepository)
    {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
        this._containerRepository = containerRepository;
        this._vesselRepository = vesselRepository;
        this._storageAreaRepository = storageAreaRepository;
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


}