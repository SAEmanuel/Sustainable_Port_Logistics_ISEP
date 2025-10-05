using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Vessels;

public interface IVesselRepository : IRepository<Vessel, VesselId>
{
    public Task<Vessel?> GetByImoNumberAsync(ImoNumber imoNumber);
    public Task<List<Vessel>> GetByNameAsync(string name);
    public Task<List<Vessel>> GetByOwnerAsync(string ownerName);
    public Task<List<Vessel>> GetFilterAsync(string? name,ImoNumber? imoNumber,string? ownerName,string? query);
}