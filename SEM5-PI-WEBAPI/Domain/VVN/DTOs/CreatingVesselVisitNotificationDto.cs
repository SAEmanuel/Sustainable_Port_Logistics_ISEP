using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Tasks;

namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class CreatingVesselVisitNotificationDto
{
    public string Code { get; set; }
    public string EstimatedTimeArrival { get; set; }
    public string EstimatedTimeDeparture { get; set; }
    public int Volume { get; set; }
    public string? Documents { get; set; }
    public List<string> ListDocks { get; set; }
    public CreatingCrewManifestDto? CrewManifest { get; set; }
    public CreatingCargoManifestDto? LoadingCargoManifest { get; set; }
    public CreatingCargoManifestDto? UnloadingCargoManifest { get; set; }
    public string VesselImo { get; set; }
    public List<CreatingTaskDto> Tasks { get; set; }


    public CreatingVesselVisitNotificationDto(string code, string estimatedTimeArrival, string estimatedTimeDeparture, int volume, string? documents, List<string> listDocks, CreatingCrewManifestDto? crewManifest, CreatingCargoManifestDto? loadingCargoManifest, CreatingCargoManifestDto? unloadingCargoManifest, string vesselImo, List<CreatingTaskDto> tasks)
    {
        Code = code;
        EstimatedTimeArrival = estimatedTimeArrival;
        EstimatedTimeDeparture = estimatedTimeDeparture;
        Volume = volume;
        Documents = documents;
        ListDocks = listDocks;
        CrewManifest = crewManifest;
        LoadingCargoManifest = loadingCargoManifest;
        UnloadingCargoManifest = unloadingCargoManifest;
        VesselImo = vesselImo;
        Tasks = tasks;
    }
}