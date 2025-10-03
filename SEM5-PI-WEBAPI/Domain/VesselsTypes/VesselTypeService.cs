using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IVesselTypeRepository _vesselTypeRepository;
        private readonly ILogger<VesselTypeService> _logger;
        
        public VesselTypeService(IUnitOfWork unitOfWork, IVesselTypeRepository vesselTypeRepository, ILogger<VesselTypeService> logger)
        {
            _unitOfWork = unitOfWork;
            _vesselTypeRepository = vesselTypeRepository;
            _logger = logger;
        }

        public async Task<List<VesselTypeDto>> GetAllAsync()
        {
            _logger.LogInformation("Business Domain: Request to fetch all Vessel Types.");
            
            var listVesselsTypesInDb = await _vesselTypeRepository.GetAllAsync();
            
            if (listVesselsTypesInDb.Count > 0) 
                _logger.LogInformation("Business Domain: Found [{Count}] Vessel Types in database.", listVesselsTypesInDb.Count);
            else
            {
                _logger.LogWarning("Business Domain: No Vessel Types were found in database.");
            }

            var listVesselsTypesDto = listVesselsTypesInDb
                .Select(instance => VesselTypeFactory.CreateDtoVesselType(instance))
                .ToList();
            
            _logger.LogInformation("Business Domain: Returning [{Count}] Vessel Types DTOs.", listVesselsTypesDto.Count);

            return listVesselsTypesDto;
        }


        public async Task<VesselTypeDto> GetByIdAsync(VesselTypeId id)
        {
            _logger.LogInformation("Business Domain: Request to fetch Vessel Type with ID = {Id}", id.Value);

            var vesselTypeInDb = await _vesselTypeRepository.GetByIdAsync(id);

            if (vesselTypeInDb == null) 
            {
                throw new BusinessRuleValidationException($"No Vessel Type Found with ID : {id.Value}");
            }

            _logger.LogInformation("Business Domain: Vessel Type with ID = {Id} found successfully.", id.Value);

            return VesselTypeFactory.CreateDtoVesselType(vesselTypeInDb);
        }

        public async Task<VesselTypeDto> AddAsync(CreatingVesselTypeDto vesselTypeDto)
        {
            _logger.LogInformation("Business Domain: Request to add new Vessel Type with Name = {Name}", vesselTypeDto.Name);

            var exists = (await GetAllAsync()).Any(q => string.Equals(q.Name, vesselTypeDto.Name, StringComparison.CurrentCultureIgnoreCase));

            if (exists) throw new BusinessRuleValidationException($"VesselType with name '{vesselTypeDto.Name}' already exists.");
            
            
            VesselType newVesselType = VesselTypeFactory.CreateBasicVesselType(vesselTypeDto);
            
            await _vesselTypeRepository.AddAsync(newVesselType);
            await _unitOfWork.CommitAsync();
            
            _logger.LogInformation("Business Domain: Vessel Type created successfully with ID = {Id}", newVesselType.Id.Value);

            return VesselTypeFactory.CreateDtoVesselType(newVesselType);
        }
        
        public async Task<VesselTypeDto> GetByNameAsync(string name)
        {
            _logger.LogInformation("Business Domain: Request to fetch Vessel Type with ID = {Name}", name);

            var vesselTypeInDb = await _vesselTypeRepository.GetByNameAsync(name);
            
            if (vesselTypeInDb == null) 
            {
                throw new BusinessRuleValidationException($"No Vessel Type Found with Name : {name}");
            }

            _logger.LogInformation("Business Domain: Vessel Type with Name = {Name} found successfully.",name);

            return VesselTypeFactory.CreateDtoVesselType(vesselTypeInDb);
        }
        
    }
}

