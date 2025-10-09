using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifestEntries;

public class CargoManifestEntryRepository : BaseRepository<CargoManifestEntry, CargoManifestEntryId>,
    ICargoManifestEntryRepository
{
    private readonly DddSample1DbContext _context;

    public CargoManifestEntryRepository(DddSample1DbContext context) : base(context.CargoManifestEntry)
    {
        _context = context;
    }
}