namespace SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

public class StorageAreaDto
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public StorageAreaType Type { get; private set; }

    public int MaxBays { get; private set; }
    public int MaxRows { get; private set; }
    public int MaxTiers { get; private set; }
    public int MaxCapacityTeu { get; private set; }
    public int CurrentCapacityTeu { get; private set; }

    public List<StorageAreaDockDistanceDto> DistancesToDocks { get; private set; }

    public StorageAreaDto(Guid id, string name, string description,
        StorageAreaType type, int maxBays, int maxRows, int maxTiers,
        int maxCapacityTeu, int currentCapacityTeu,
        List<StorageAreaDockDistanceDto> distancesToDocks)
    {
        Id = id;
        Name = name;
        Description = description;
        Type = type;
        MaxBays = maxBays;
        MaxRows = maxRows;
        MaxTiers = maxTiers;
        MaxCapacityTeu = maxCapacityTeu;
        CurrentCapacityTeu = currentCapacityTeu;
        DistancesToDocks = distancesToDocks;
    }
}