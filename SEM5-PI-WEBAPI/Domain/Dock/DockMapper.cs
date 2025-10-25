using SEM5_PI_WEBAPI.Domain.Dock.DTOs;

namespace SEM5_PI_WEBAPI.Domain.Dock;

public class DockMapper
{
    public static DockDto RegisterDockDto(EntityDock instance)
    {
        return new DockDto(
            instance.Id.AsGuid(),
            instance.Code,
            instance.PhysicalResourceCodes,
            instance.Location,
            instance.LengthM,
            instance.DepthM,
            instance.MaxDraftM,
            instance.Status,
            instance.AllowedVesselTypeIds
        );
    }
}