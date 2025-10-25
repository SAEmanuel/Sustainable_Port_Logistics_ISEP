using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes;

public class VesselTypeMappers
{
    public static VesselTypeDto CreateDtoVesselType(VesselType instanceDb)
    {
        return new VesselTypeDto(instanceDb.Id.AsGuid(), instanceDb.Name,
            instanceDb.Description, instanceDb.MaxBays,
            instanceDb.MaxRows, instanceDb.MaxTiers,
            instanceDb.Capacity);
    }
}