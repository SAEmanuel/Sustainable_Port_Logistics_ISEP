using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.VVN;

public class VesselVisitNotificationRepository : BaseRepository<VesselVisitNotification,VesselVisitNotificationId> , IVesselVisitNotificationRepository
{
    private readonly DddSample1DbContext _context;
    public VesselVisitNotificationRepository(DddSample1DbContext context) : base(context.VesselVisitNotification)
    {
        _context = context;
    }
}