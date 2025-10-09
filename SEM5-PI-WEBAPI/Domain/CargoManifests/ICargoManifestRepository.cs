using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests;

public interface ICargoManifestRepository : IRepository<CargoManifest, CargoManifestId>
{
    Task<int> CountAsync();
    Task<CargoManifest> GetByCodeAsync(string code);
}