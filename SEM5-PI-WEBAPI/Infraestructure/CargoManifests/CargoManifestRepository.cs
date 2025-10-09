using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifests;

public class CargoManifestRepository : BaseRepository<CargoManifest, CargoManifestId>, ICargoManifestRepository
{
    private readonly DbSet<CargoManifest> _cargoManifests;
    private readonly DbSet<CargoManifestEntry> _cargoManifestEntries;
    private readonly DbSet<EntityContainer> _containers;

    public CargoManifestRepository(DddSample1DbContext context) : base(context.CargoManifest)
    {
        _cargoManifests = context.CargoManifest;
    }

    public async Task<int> CountAsync()
    {
        return await _cargoManifests.CountAsync();
    }


    public async Task<List<CargoManifest>> GetAllAsync()
    {
        return await _cargoManifests
            .Include(cm => cm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .ToListAsync();
    }

    public async Task<CargoManifest> GetByIdAsync(CargoManifestId id)
    {
        return await _cargoManifests
            .Where(cm => cm.Id.Equals(id))
            .Include(cm => cm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .FirstOrDefaultAsync();
    }

    public async Task<CargoManifest> GetByCodeAsync(string code)
    {
        return await _cargoManifests
            .Where(cm => cm.Code.Equals(code))
            .Include(cm => cm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .FirstOrDefaultAsync();
    }
}