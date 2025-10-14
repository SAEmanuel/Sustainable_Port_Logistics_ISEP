using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
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
    
    public async Task<VesselVisitNotification?> GetByCodeAsync(VvnCode code)
    {
        return await _context.VesselVisitNotification.FirstOrDefaultAsync(v => v.Code.Code == code.Code);
    }
    
    public async Task<VesselVisitNotification?> GetCompleteByIdAsync(VesselVisitNotificationId id)
    {
        return await _context.VesselVisitNotification
            .Include(v => v.Dock)
            .Include(v => v.CrewManifest)
            .ThenInclude(cm => cm.CrewMembers)
            .Include(v => v.LoadingCargoManifest)
            .ThenInclude(cgm => cgm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .Include(v => v.UnloadingCargoManifest)
            .ThenInclude(cgm => cgm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .Include(v => v.Tasks)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<VesselVisitNotification?> GetCompleteByCodeAsync(VvnCode code)
    {
        return await _context.VesselVisitNotification
            .Include(v => v.Dock)
            .Include(v => v.CrewManifest)
            .ThenInclude(cm => cm.CrewMembers)
            .Include(v => v.LoadingCargoManifest)
            .ThenInclude(cgm => cgm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .Include(v => v.UnloadingCargoManifest)
            .ThenInclude(cgm => cgm.ContainerEntries)
            .ThenInclude(e => e.Container)
            .Include(v => v.Tasks)
            .FirstOrDefaultAsync(v => v.Code.YearNumber == code.YearNumber 
                                      && v.Code.SequenceNumber == code.SequenceNumber);
    }

}


