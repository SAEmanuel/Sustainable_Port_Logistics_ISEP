using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IVesselTypeRepository _vesselTypeRepository;
        
        public VesselTypeService(IUnitOfWork unitOfWork, IVesselTypeRepository vesselTypeRepository)
        {
            _unitOfWork = unitOfWork;
            _vesselTypeRepository = vesselTypeRepository;
        }

        public async Task<List<VesselTypeDto>> GetAllAsync()
        {
            var listVesselsTypesInDb = await _vesselTypeRepository.GetAllAsync();

            var listVesselsTypesDto = listVesselsTypesInDb
                .Select(instance => VesselTypeFactory.CreateDtoVesselType(instance))
                .ToList();

            return listVesselsTypesDto;
        }


        public async Task<VesselTypeDto> GetByIdAsync(VesselTypeId id)
        {
            var vesselTypeInDb = await this._vesselTypeRepository.GetByIdAsync(id);

            return VesselTypeFactory.CreateDtoVesselType(vesselTypeInDb);
        }

        public async Task<VesselTypeDto> AddAsync(CreatingVesselTypeDto vesselTypeDto)
        {
            VesselType newVesselType = VesselTypeFactory.CreateBasicVesselType(vesselTypeDto);
            
            await _vesselTypeRepository.AddAsync(newVesselType);
            await _unitOfWork.CommitAsync();
            
            return VesselTypeFactory.CreateDtoVesselType(newVesselType);
        }
        
    }
}

