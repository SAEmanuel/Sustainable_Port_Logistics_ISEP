using System.ComponentModel;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;

public class CargoManifestEntry : Entity<CargoManifestEntryId>
{
    public EntityContainer Container { get; set; }
    public int Bay { get; set; }
    public int Row { get; set; }
    public int Tier { get; set; }

    protected CargoManifestEntry()
    {
    }

    public CargoManifestEntry(EntityContainer container, int bay, int row, int tier)
    {
        Id = new CargoManifestEntryId(Guid.NewGuid());
        Container = container;
        Bay = bay;
        Row = row;
        Tier = tier;
    }
}