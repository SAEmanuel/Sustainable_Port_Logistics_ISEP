using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifests;

public class CargoManifestRepository : BaseRepository<CargoManifest, CargoManifestId>, ICargoManifestRepository
{
    private readonly DbSet<CargoManifest> _cargoManifests;

    public CargoManifestRepository(DddSample1DbContext context) : base(context.CargoManifest)
    {
        _cargoManifests = context.CargoManifest;
    }

    public async Task<int> CountAsync()
    {
        return await _cargoManifests.CountAsync();
    }

    public async Task<CargoManifest> GetByCodeAsync(string code)
    {
        return await _cargoManifests
            .FirstOrDefaultAsync(cm => cm.Code == code);
    }
}