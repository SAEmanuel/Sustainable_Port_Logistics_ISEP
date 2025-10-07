namespace SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

public class StorageAreaDockDistanceDto
{
    public string DockCode { get; set; }
    public float DistanceKm { get; set; }

    public StorageAreaDockDistanceDto(string dockCode, float distanceKm)
    {
        DockCode = dockCode;
        DistanceKm = distanceKm;
    }
}