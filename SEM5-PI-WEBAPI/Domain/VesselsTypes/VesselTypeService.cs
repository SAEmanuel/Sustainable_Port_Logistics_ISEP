using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeService : IVesselTypeService
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
            
            _logger.LogInformation("Business Domain: Found [{Count}] Vessel Types in database.", listVesselsTypesInDb.Count);

            var listVesselsTypesDto = listVesselsTypesInDb
                .Select(instance => VesselTypeMappers.CreateDtoVesselType(instance))
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

            return VesselTypeMappers.CreateDtoVesselType(vesselTypeInDb);
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

            return VesselTypeMappers.CreateDtoVesselType(newVesselType);
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

            return VesselTypeMappers.CreateDtoVesselType(vesselTypeInDb);
        }
        
        public async Task<List<VesselTypeDto>> GetByDescriptionAsync(string description)
        {
            _logger.LogInformation("Business Domain: Request to fetch Vessel/s Type/s with Description = {Description}", description);

            var listVesselsTypesInDb = await _vesselTypeRepository.GetByDescriptionAsync(description);
            
            if (listVesselsTypesInDb.Count == 0) 
            {
                throw new BusinessRuleValidationException($"No Vessel/s Type/s Found with Description : {description}");
            }
            
            var listVesselsTypesDto = listVesselsTypesInDb
                .Select(instance => VesselTypeMappers.CreateDtoVesselType(instance))
                .ToList();
            

            _logger.LogInformation("Business Domain: Where found [{Count}] Vessel/s Type/s with Description = {Description} found successfully.",listVesselsTypesDto.Count,description);

            return listVesselsTypesDto;
        }

        public async Task<List<VesselTypeDto>> FilterAsync(string? name, string? description, string? query)
        {
            _logger.LogInformation("Business Domain: Filtering VesselTypes with filters -> Name = {Name}, Description = {Description}, Query = {Query}", name, description, query);

            var listVesselsTypesInDb = await _vesselTypeRepository.FilterAsync(name,description,query);
            
            if(listVesselsTypesInDb.Count == 0)
                throw new BusinessRuleValidationException($"No Vessel/s Type/s Found with filters -> Name = {name}, Description = {description}, Query = {query}");
            
            _logger.LogInformation("Business Domain: Where found [{Count}] Vessel/s Type/s with filters -> Name = {Name}, Description = {Description}, Query = {Query}",listVesselsTypesInDb.Count,name, description, query);
            
            return listVesselsTypesInDb.Select(instance => VesselTypeMappers.CreateDtoVesselType(instance)).ToList();
        }
        
        public async Task<VesselTypeDto> UpdateAsync(VesselTypeId id, UpdateVesselTypeDto dto)
        {
            _logger.LogInformation("Business Domain: Request to update Vessel Type with ID = {Id}", id.Value);

            var vesselTypeInDb = await _vesselTypeRepository.GetByIdAsync(id);
            if (vesselTypeInDb == null)
                throw new BusinessRuleValidationException($"No Vessel Type found with ID = {id.Value}");

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var vesselWithNewName = await _vesselTypeRepository.GetByNameAsync(dto.Name);

                if (vesselWithNewName != null && vesselWithNewName.Id != vesselTypeInDb.Id)
                    throw new BusinessRuleValidationException($"A Vessel Type with the name '{dto.Name}' already exists. Please choose a different name.");

                vesselTypeInDb.ChangeName(dto.Name);
            }

                

            if (!string.IsNullOrWhiteSpace(dto.Description))
                vesselTypeInDb.ChangeDescription(dto.Description);

            if (dto.MaxBays.HasValue)
                vesselTypeInDb.ChangeMaxBays(dto.MaxBays.Value);

            if (dto.MaxRows.HasValue)
                vesselTypeInDb.ChangeMaxRows(dto.MaxRows.Value);

            if (dto.MaxTiers.HasValue)
                vesselTypeInDb.ChangeMaxTiers(dto.MaxTiers.Value);

            await _unitOfWork.CommitAsync();

            _logger.LogInformation("Business Domain: Vessel Type with ID = {Id} updated successfully.", id.Value);

            return VesselTypeMappers.CreateDtoVesselType(vesselTypeInDb);
        }

        public async Task DeleteAsync(VesselTypeId id)
        {
            _logger.LogInformation("Business Domain: Request to delete Vessel Type with ID = {Id}", id.Value);

            var vesselTypeInDb = await _vesselTypeRepository.GetByIdAsync(id);

            if (vesselTypeInDb == null)
            {
                _logger.LogWarning("Business Domain: Vessel Type with ID = {Id} not found. Delete aborted.", id.Value);
                throw new BusinessRuleValidationException($"No Vessel Type found with ID = {id.Value}");
            }

            _vesselTypeRepository.Remove(vesselTypeInDb);
            await _unitOfWork.CommitAsync();

            _logger.LogInformation("Business Domain: Vessel Type with ID = {Id} deleted successfully.", id.Value);
        }

    }
}

