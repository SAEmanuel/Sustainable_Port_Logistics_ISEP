using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;

namespace SEM5_PI_WEBAPI.Domain.Vessels;

public class VesselFactory
{
    public static Vessel CreateVessel(CreatingVesselDto instanceDto)
    {
        return new Vessel(instanceDto.ImoNumber,instanceDto.Name,instanceDto.Owner,instanceDto.VesselTypeId);
    }

    public static VesselDto CreateVesselDto(Vessel instance)
    {
        return new VesselDto(instance.Id.AsGuid(),instance.ImoNumber, instance.Name, instance.Owner, instance.VesselTypeId);
    }
}