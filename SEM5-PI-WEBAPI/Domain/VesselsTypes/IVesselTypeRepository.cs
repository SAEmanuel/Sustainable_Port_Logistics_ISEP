using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public interface IVesselTypeRepository : IRepository<VesselType, VesselTypeId>
    {
        Task<VesselType?> GetByNameAsync(string name);
        Task<List<VesselType>> GetByDescriptionAsync(string description);
    }
}

