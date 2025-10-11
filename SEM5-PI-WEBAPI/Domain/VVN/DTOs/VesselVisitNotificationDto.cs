using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using Task = SEM5_PI_WEBAPI.Domain.Tasks.Task;


namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class VesselVisitNotificationDto
{
    public string Id { get; private set; }
    public string Code { get; private set; }

    public ClockTime EstimatedTimeArrival { get; private set; }
    public ClockTime EstimatedTimeDeparture { get; private set; }
    public ClockTime? ActualTimeArrival { get; private set; }
    public ClockTime? ActualTimeDeparture { get; private set; }
    public ClockTime? AcceptenceDate { get; private set; }

    public int Volume { get; private set; }
    public PdfDocumentCollection Documents { get; private set; }

    public VvnStatus Status { get; private set; }
    public IReadOnlyCollection<DockDto> ListDocks { get; private set; }
    public CrewManifestDto? CrewManifest { get; private set; }
    public CargoManifestDto? LoadingCargoManifest { get; private set; }
    public CargoManifestDto? UnloadingCargoManifest { get; private set; }
    public string VesselImo { get; private set; }

    public IReadOnlyCollection<TaskDto> Tasks { get; private set; }

    public VesselVisitNotificationDto(
        string id,
        string code,
        ClockTime estimatedTimeArrival,
        ClockTime estimatedTimeDeparture,
        ClockTime? actualTimeArrival,
        ClockTime? actualTimeDeparture,
        ClockTime? acceptenceDate,
        int volume,
        PdfDocumentCollection documents,
        VvnStatus status,
        IEnumerable<DockDto> docks,
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
        ListDocks = docks.ToList();
        CrewManifest = crewManifest;
        LoadingCargoManifest = loadingCargoManifest;
        UnloadingCargoManifest = unloadingCargoManifest;
        VesselImo = imo;
        Tasks = tasks.ToList();
    }
}
