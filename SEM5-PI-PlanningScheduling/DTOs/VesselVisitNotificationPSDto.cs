namespace SEM5_PI_DecisionEngineAPI.DTOs;

public class VesselVisitNotificationPSDto
{
    public string Id { get; set; }
    public DateTime EstimatedTimeArrival { get; set; }
    public DateTime EstimatedTimeDeparture { get; set; }

    public string Status { get; set; }
    public string? Dock { get; set; }

    public CargoManifestPSDto? LoadingCargoManifest { get; set; }
    public CargoManifestPSDto? UnloadingCargoManifest { get; set; }

    public string VesselImo { get; set; }
}

public class CargoManifestPSDto
{
    public string Code { get; set; }
    public List<CargoManifestEntryPSDto> Entries { get; set; }
}

public class CargoManifestEntryPSDto
{
    public ContainerPSDto Container { get; set; }
}

public class ContainerPSDto
{
    public string IsoCode { get; set; }
}

