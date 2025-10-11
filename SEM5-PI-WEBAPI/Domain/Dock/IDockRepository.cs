using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock
{
    public interface IDockRepository : IRepository<EntityDock, DockId>
    {
        Task<EntityDock?> GetByCodeAsync(DockCode code);
        Task<List<EntityDock>> GetByVesselTypeAsync(VesselTypeId vesselTypeId);
        Task<List<EntityDock>> GetByLocationAsync(string location);
        Task<List<EntityDock>> GetFilterAsync(DockCode? code, VesselTypeId? vesselTypeId, string? location, string? query);
        
        Task<List<DockCode>> GetAllDockCodesAsync();
    }
}