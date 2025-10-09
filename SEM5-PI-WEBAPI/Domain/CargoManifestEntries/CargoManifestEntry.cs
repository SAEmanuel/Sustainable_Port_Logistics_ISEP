using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;

namespace SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

public class CargoManifestEntry : Entity<CargoManifestEntryId>
{
    public EntityContainer Container { get; set; }
    public StorageAreaId StorageAreaId { get; private set; }
    public int Bay { get; set; }
    public int Row { get; set; }
    public int Tier { get; set; }

    protected CargoManifestEntry()
    {
    }

    public CargoManifestEntry(EntityContainer container, StorageAreaId storageAreaId, int bay, int row, int tier)
    {
        Id = new CargoManifestEntryId(Guid.NewGuid());
        Container = container;
        StorageAreaId = storageAreaId;
        Bay = bay;
        Row = row;
        Tier = tier;
    }
}