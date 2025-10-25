using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Vessels;

public class VesselService : IVesselService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVesselRepository _vesselRepository;
    private readonly IVesselTypeRepository _vesselTypeRepository;
    private readonly ILogger<VesselService> _logger;

    public VesselService(IUnitOfWork unitOfWork, IVesselRepository vesselRepository,IVesselTypeRepository vesselTypeRepository, ILogger<VesselService> logger)
    {
        _unitOfWork = unitOfWork;
        _vesselRepository = vesselRepository;
        _vesselTypeRepository = vesselTypeRepository;
        _logger = logger;
    }
    
    public async Task<List<VesselDto>> GetAllAsync()
    {
        _logger.LogInformation("Business Domain: Request to fetch all Vessels.");
            
        var listVesselsInDb = await _vesselRepository.GetAllAsync();
        
        _logger.LogInformation("Business Domain: Found [{Count}] Vessel in database.", listVesselsInDb.Count);

        var listVesselsDto = listVesselsInDb
            .Select(instance => VesselMapper.CreateVesselDto(instance))
            .ToList();
            
        _logger.LogInformation("Business Domain: Returning [{Count}] Vessels DTOs.", listVesselsDto.Count);

        return listVesselsDto;
    }


    public async Task<VesselDto> CreateAsync(CreatingVesselDto creatingVesselDto)
    {
        
        _logger.LogInformation("Business Domain: Request to add new Vessel with IMO Number = {IMO}", creatingVesselDto.ImoNumber);

        var imo = new ImoNumber(creatingVesselDto.ImoNumber);
        var imoexist = await _vesselRepository.GetByImoNumberAsync(imo);
        
        if (imoexist != null) throw new BusinessRuleValidationException($"Vessel with IMO Number '{creatingVesselDto.ImoNumber}' already exists on DB.");
    
        var typeDontExist = (await _vesselTypeRepository.GetByNameAsync(creatingVesselDto.VesselTypeName)) ;

        if (typeDontExist == null) throw new BusinessRuleValidationException($"Vessel Type with Name '{creatingVesselDto.VesselTypeName}' doesn't exists on DB.");
        
        Vessel createdVessel = VesselFactory.CreateVessel(creatingVesselDto,typeDontExist.Id);
            
        await _vesselRepository.AddAsync(createdVessel);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Business Domain: Vessel Created Successfully with IMO Number [{IMO}] and System ID [{ID}].", createdVessel.ImoNumber,createdVessel.Id);

        return VesselMapper.CreateVesselDto(createdVessel);
    }

    public async Task<VesselDto> GetByIdAsync(VesselId vesselId)
    {
        _logger.LogInformation("Business Domain: Request to fetch Vessel with ID = {Id}", vesselId.Value);

        var vesselInDb = await _vesselRepository.GetByIdAsync(vesselId);

        if (vesselInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Found with ID : {vesselId.Value}");
       
        _logger.LogInformation("Business Domain: Vessel with ID = {Id} found successfully.", vesselId.Value);
    
        return VesselMapper.CreateVesselDto(vesselInDb);
    }


    public async Task<VesselDto> GetByImoNumberAsync(string imoNumberString)
    {
        ImoNumber imoNumber = new ImoNumber(imoNumberString);
        
        _logger.LogInformation("Business Domain: Request to fetch Vessel with IMO Number = {IMO}", imoNumber.Value);

        var vesselOnDb = await _vesselRepository.GetByImoNumberAsync(imoNumber);

        if (vesselOnDb == null)
            throw new BusinessRuleValidationException($"No Vessel Found with IMO Number : {imoNumber.Value}");
        
        _logger.LogInformation("Business Domain: Vessel with IMO Number = {IMO} found successfully.", imoNumber.Value);

        return VesselMapper.CreateVesselDto(vesselOnDb);
    }
    
    public async Task<List<VesselDto>> GetByNameAsync(string name)
    {
        _logger.LogInformation("Business Domain: Request to fetch Vessel with Name = {IMO}", name);

        var vesselListOnDb = await _vesselRepository.GetByNameAsync(name);

        if (vesselListOnDb.Count == 0)
            throw new BusinessRuleValidationException($"No Vessel/s were Found with Name : {name}");
        
        _logger.LogInformation("Business Domain: Vessel with Name = {NAME} found successfully.", name);

        var vesselListDto = vesselListOnDb.Select(VesselMapper.CreateVesselDto).ToList();
        
        return vesselListDto;
    }
    
    public async Task<List<VesselDto>> GetByOwnerAsync(string ownerName)
    {
        _logger.LogInformation("Business Domain: Request to fetch Vessel with Owner = {Owner}", ownerName);

        var vesselListOnDb = await _vesselRepository.GetByOwnerAsync(ownerName);

        if (vesselListOnDb.Count == 0)
            throw new BusinessRuleValidationException($"No Vessel/s were Found with Owner : {ownerName}");
        
        _logger.LogInformation("Business Domain: Vessel with Owner = {Owner} found successfully.", ownerName);

        var vesselListDto = vesselListOnDb.Select(VesselMapper.CreateVesselDto).ToList();
        
        return vesselListDto;
    }

    public async Task<List<VesselDto>> GetFilterAsync(string? name, string? imo, string? ownerName,string? query)
    {
        _logger.LogInformation("Business Domain: Filtering Vessels with filters -> [Name = {Name} | IMO Number = {Imo} | Owner Name = {owner} | Query = {query}]", name,imo,ownerName,query);

        ImoNumber? imoNumber = null;
        if (imo != null) imoNumber = new ImoNumber(imo);

        var vesselListOnDb = await _vesselRepository.GetFilterAsync(name,imoNumber,ownerName,query);

        if (vesselListOnDb.Count == 0) throw new BusinessRuleValidationException($"No Vessel/s Type/s Found with filters -> Name = {name}, IMO Number = {imo}, Owner Name = {ownerName},Query = {query}");
        
        _logger.LogInformation("Business Domain: Where found [{Count}] Vessel/s Type/s with filters",vesselListOnDb.Count);

        return vesselListOnDb.Select(VesselMapper.CreateVesselDto).ToList();
    }

    public async Task<VesselDto> PatchByImoAsync(string imo, UpdatingVesselDto dto)
    {
        var imoNumber = new ImoNumber(imo);

        var vessel = await _vesselRepository.GetByImoNumberAsync(imoNumber);

        if (vessel == null)
            throw new BusinessRuleValidationException($"No Vessel found with IMO {imo}.");

        if (!string.IsNullOrWhiteSpace(dto.Name))
            vessel.UpdateName(dto.Name);

        if (!string.IsNullOrWhiteSpace(dto.Owner))
            vessel.UpdateOwner(dto.Owner);
        

        await _unitOfWork.CommitAsync();

        return VesselMapper.CreateVesselDto(vessel);
    }

}