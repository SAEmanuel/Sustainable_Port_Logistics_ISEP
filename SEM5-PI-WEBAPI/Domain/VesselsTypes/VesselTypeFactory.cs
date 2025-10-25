
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeFactory
    {
        
        public static VesselType CreateBasicVesselType(CreatingVesselTypeDto instanceDto)
        {
            return new VesselType(instanceDto.Name, instanceDto.MaxBays, instanceDto.MaxRows,
                instanceDto.MaxTiers, instanceDto.Description);
        }
        
    } 
}

