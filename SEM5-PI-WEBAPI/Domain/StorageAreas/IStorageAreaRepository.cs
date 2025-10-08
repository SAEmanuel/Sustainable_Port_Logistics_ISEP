using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public interface IStorageAreaRepository : IRepository<StorageArea,StorageAreaId>
{
    Task<StorageArea?> GetByNameAsync(string name);
}