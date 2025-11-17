using SEM5_PI_DecisionEngineAPI.DTOs;

namespace SEM5_PI_DecisionEngineAPI.Mappers;

public static class VesselVisitNotificationMapper
{
    public static VesselVisitNotificationPSDto ToPSDto(VesselVisitNotificationDto full)
    {
        return new VesselVisitNotificationPSDto
        {
            Id = full.Id,
            EstimatedTimeArrival = full.EstimatedTimeArrival,
            EstimatedTimeDeparture = full.EstimatedTimeDeparture,
            Status = full.Status,
            Dock = full.Dock,
            VesselImo = full.VesselImo,

            LoadingCargoManifest = full.LoadingCargoManifest != null
                ? new CargoManifestPSDto
                {
                    Code = full.LoadingCargoManifest.Code,
                    Entries = full.LoadingCargoManifest.Entries
                        .Select(e => new CargoManifestEntryPSDto
                        {
                            Container = new ContainerPSDto
                            {
                                IsoCode = e.Container.IsoCode.Value
                            }
                        })
                        .ToList()
                }
                : null,

            UnloadingCargoManifest = full.UnloadingCargoManifest != null
                ? new CargoManifestPSDto
                {
                    Code = full.UnloadingCargoManifest.Code,
                    Entries = full.UnloadingCargoManifest.Entries
                        .Select(e => new CargoManifestEntryPSDto
                        {
                            Container = new ContainerPSDto
                            {
                                IsoCode = e.Container.IsoCode.Value
                            }
                        })
                        .ToList()
                }
                : null
        };
    }
}