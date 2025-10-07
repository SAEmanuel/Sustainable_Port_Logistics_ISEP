using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

public class CreatingStorageAreaDto
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public StorageAreaType Type { get; set; }
    public int MaxBays { get; set; }
    public int MaxRows { get; set; }
    public int MaxTiers { get; set; }

    public List<StorageAreaDockDistanceDto> DistancesToDocks { get; set; } = new();

    public CreatingStorageAreaDto(string name, string? description, StorageAreaType type,
        int maxBays, int maxRows, int maxTiers, List<StorageAreaDockDistanceDto> distancesToDocks)
    {
        Name = name;
        Description = description;
        Type = type;
        MaxBays = maxBays;
        MaxRows = maxRows;
        MaxTiers = maxTiers;
        DistancesToDocks = distancesToDocks ?? new List<StorageAreaDockDistanceDto>();
    }
}