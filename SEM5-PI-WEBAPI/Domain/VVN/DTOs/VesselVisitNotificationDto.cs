using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;

namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class VesselVisitNotificationDto
{
    public string Id { get; private set; }
    public string Code { get; private set; }

    public DateTime EstimatedTimeArrival { get; private set; }
    public DateTime EstimatedTimeDeparture { get; private set; }
    public DateTime? ActualTimeArrival { get; private set; }
    public DateTime? ActualTimeDeparture { get; private set; }
    public DateTime? AcceptenceDate { get; private set; }

    public int Volume { get; private set; }
    public PdfDocumentCollection Documents { get; private set; }

    public string Status { get; private set; }
    public string? Dock { get; private set; }
    public CrewManifestDto? CrewManifest { get; private set; }
    public CargoManifestDto? LoadingCargoManifest { get; private set; }
    public CargoManifestDto? UnloadingCargoManifest { get; private set; }
    public string VesselImo { get; private set; }

    public IReadOnlyCollection<TaskDto> Tasks { get; private set; }

    public VesselVisitNotificationDto(
        string id,
        string code,
        DateTime estimatedTimeArrival,
        DateTime estimatedTimeDeparture,
        DateTime? actualTimeArrival,
        DateTime? actualTimeDeparture,
        DateTime? acceptenceDate,
        int volume,
        PdfDocumentCollection documents,
        string? dock,
        string status,
        CrewManifestDto? crewManifest,
        CargoManifestDto? loadingCargoManifest,
        CargoManifestDto? unloadingCargoManifest,
        string imo,
        IEnumerable<TaskDto> tasks)
    {
        Id = id;
        Code = code;
        EstimatedTimeArrival = estimatedTimeArrival;
        EstimatedTimeDeparture = estimatedTimeDeparture;
        ActualTimeArrival = actualTimeArrival;
        ActualTimeDeparture = actualTimeDeparture;
        AcceptenceDate = acceptenceDate;
        Volume = volume;
        Documents = documents;
        Status = status;
        Dock = dock;
        CrewManifest = crewManifest;
        LoadingCargoManifest = loadingCargoManifest;
        UnloadingCargoManifest = unloadingCargoManifest;
        VesselImo = imo;
        Tasks = tasks?.ToList() ?? new List<TaskDto>();
    }
}
