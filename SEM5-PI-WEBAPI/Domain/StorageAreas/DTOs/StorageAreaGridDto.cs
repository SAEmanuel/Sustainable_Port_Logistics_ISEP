namespace SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

public sealed class StorageSlotDto
{
    public int Bay { get; init; }
    public int Row { get; init; }
    public int Tier { get; init; }
    public string? Iso { get; init; } // null -> slot vazio

    public StorageSlotDto(int bay, int row, int tier, string? iso)
    {
        Bay = bay;
        Row = row;
        Tier = tier;
        Iso = iso;
    }
}

public sealed class StorageAreaGridDto
{
    public int MaxBays { get; init; }
    public int MaxRows { get; init; }
    public int MaxTiers { get; init; }

    /// <summary>
    /// Lista de slots. Para reduzir payload, **apenas slots ocupados** têm Iso != null.
    /// </summary>
    public List<StorageSlotDto> Slots { get; init; }

    public StorageAreaGridDto(int maxBays, int maxRows, int maxTiers, List<StorageSlotDto> slots)
    {
        MaxBays = maxBays;
        MaxRows = maxRows;
        MaxTiers = maxTiers;
        Slots = slots;
    }
}