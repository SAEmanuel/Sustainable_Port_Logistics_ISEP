using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;

public interface ICargoManifestEntryRepository : IRepository<CargoManifestEntry, CargoManifestEntryId>
{
}