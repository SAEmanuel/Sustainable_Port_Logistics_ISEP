
namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeFactory
    {
        
        public static VesselType CreateBasicVesselType(CreatingVesselTypeDto instanceDto)
        {
            return new VesselType(instanceDto.Name, instanceDto.MaxBays, instanceDto.MaxRows,
                instanceDto.MaxTiers, instanceDto.Description);
        }

        public static VesselTypeDto CreateDtoVesselType(VesselType instanceDb)
        {
            return new VesselTypeDto(instanceDb.Id.AsGuid(), instanceDb.Name,
                instanceDb.Description, instanceDb.MaxBays,
                instanceDb.MaxRows, instanceDb.MaxTiers,
                instanceDb.Capacity);
        }

        
    } 
}

