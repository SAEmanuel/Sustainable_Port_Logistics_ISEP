using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.Dock;

namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class UpdateVesselVisitNotificationDto
{
    public string? EstimatedTimeArrival { get; set; }
    public string? EstimatedTimeDeparture { get; set; }
    public int? Volume { get; set; }
    public PdfDocumentCollection? Documents { get; set; }
    public string? Dock { get; set; }
    public CreatingCrewManifestDto? CrewManifest { get; set; }
    public CreatingCargoManifestDto? LoadingCargoManifest { get; set; }
    public CreatingCargoManifestDto? UnloadingCargoManifest { get; set; }
    public string? ImoNumber { get; set; }
}
