using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public interface IVesselVisitNotificationRepository : IRepository<VesselVisitNotification,VesselVisitNotificationId>
{
    Task<VesselVisitNotification?> GetByCodeAsync(VvnCode code);
    Task<VesselVisitNotification?> GetCompleteByCodeAsync(VvnCode code);
    Task<VesselVisitNotification?> GetCompleteByIdAsync(VesselVisitNotificationId id);
    Task<List<VesselVisitNotification>> GetAllComplete();
    Task<List<VesselVisitNotification>> GetAllAcceptedComplete();
}