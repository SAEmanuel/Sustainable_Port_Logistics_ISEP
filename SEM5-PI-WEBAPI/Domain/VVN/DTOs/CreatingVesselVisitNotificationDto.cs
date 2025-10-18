using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;

namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class CreatingVesselVisitNotificationDto
{
    public string EstimatedTimeArrival { get; set; }
    public string EstimatedTimeDeparture { get; set; }
    public int Volume { get; set; }
    public string? Documents { get; set; }
    public CreatingCrewManifestDto CrewManifest { get; set; }
    public CreatingCargoManifestDto? LoadingCargoManifest { get; set; }
    public CreatingCargoManifestDto? UnloadingCargoManifest { get; set; }
    public string VesselImo { get; set; }
    public string EmailSar { get; set; }

    [JsonConstructor]
    public CreatingVesselVisitNotificationDto(
        string estimatedTimeArrival,
        string estimatedTimeDeparture,
        int volume,
        string? documents,
        CreatingCrewManifestDto? crewManifest,
        CreatingCargoManifestDto? loadingCargoManifest,
        CreatingCargoManifestDto? unloadingCargoManifest,
        string vesselImo,
        string emailSar) 
    {
        EstimatedTimeArrival = estimatedTimeArrival;
        EstimatedTimeDeparture = estimatedTimeDeparture;
        Volume = volume;
        Documents = documents;
        CrewManifest = crewManifest;
        LoadingCargoManifest = loadingCargoManifest;
        UnloadingCargoManifest = unloadingCargoManifest;
        VesselImo = vesselImo;
        EmailSar = emailSar;
    }
}