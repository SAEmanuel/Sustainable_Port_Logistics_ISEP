using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaFactory
{
    public static StorageArea CreateStorageArea(CreatingStorageAreaDto dto)
    {
        var dockDistances = dto.DistancesToDocks
            .Select(d => new StorageAreaDockDistance(new DockCode(d.DockCode), d.DistanceKm))
            .ToList();

        return new StorageArea(dto.Name, dto.Description, dto.Type,
            dto.MaxBays, dto.MaxRows, dto.MaxTiers, dockDistances);
    }

    public static StorageAreaDto CreateStorageAreaDto(StorageArea storageArea)
    {
        var dockDtos = storageArea.DistancesToDocks
            .Select(d => new StorageAreaDockDistanceDto(d.Dock.Value, d.Distance))
            .ToList();

        return new StorageAreaDto(
            storageArea.Id.AsGuid(),
            storageArea.Name,
            storageArea.Description ?? "No description.",
            storageArea.Type,
            storageArea.MaxBays,
            storageArea.MaxRows,
            storageArea.MaxTiers,
            storageArea.MaxCapacityTeu,
            storageArea.CurrentCapacityTeu,
            dockDtos
        );
    }
}