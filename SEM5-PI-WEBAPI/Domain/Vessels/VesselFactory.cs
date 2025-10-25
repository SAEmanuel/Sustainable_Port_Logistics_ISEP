using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Vessels;

public class VesselFactory
{
    public static Vessel CreateVessel(CreatingVesselDto instanceDto, VesselTypeId vesselTypeId)
    {
        return new Vessel(instanceDto.ImoNumber,instanceDto.Name,instanceDto.Owner,vesselTypeId);
    }
    
}