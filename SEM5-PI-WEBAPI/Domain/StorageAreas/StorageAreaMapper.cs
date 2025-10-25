using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaMapper
{
    public static StorageAreaDto CreateStorageAreaDto(StorageArea storageArea)
    {
        var dockDtos = storageArea.DistancesToDocks
            .Select(d => new StorageAreaDockDistanceDto(d.Dock.Value, d.Distance))
            .ToList();
        
        var physicalResources = storageArea.PhysicalResources.
            Select(p => p.Value)
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
            dockDtos,
            physicalResources
        );
    }
}