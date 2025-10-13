using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.Docks
{
    public class DockRepository : BaseRepository<EntityDock, DockId>, IDockRepository
    {
        private readonly DddSample1DbContext _context;

        public DockRepository(DddSample1DbContext context) : base(context.Dock)
        {
            _context = context;
        }

        public async Task<EntityDock?> GetByCodeAsync(DockCode code)
        {
            return await _context.Dock
                .FirstOrDefaultAsync(d => d.Code.Value == code.Value);
        }

        public async Task<EntityDock?> GetByPhysicalResourceCodeAsync(PhysicalResourceCode code)
        {
            return await _context.Dock
                .FirstOrDefaultAsync(d => d.PhysicalResourceCodes.Any(p => p.Value == code.Value));
        }

        public async Task<List<EntityDock>> GetByVesselTypeAsync(VesselTypeId vesselTypeId)
        {
            return await _context.Dock
                .Where(d => d.AllowedVesselTypeIds.Any(vt => vt.Value == vesselTypeId.Value))
                .ToListAsync();
        }

        public async Task<List<EntityDock>> GetByLocationAsync(string location)
        {
            if (string.IsNullOrWhiteSpace(location)) return new List<EntityDock>();
            var norm = location.Trim().ToLower();

            return await _context.Dock
                .Where(d => d.Location.ToLower().Contains(norm))
                .ToListAsync();
        }

        public async Task<List<EntityDock>> GetFilterAsync(
            DockCode? code,
            VesselTypeId? vesselTypeId,
            string? location,
            string? query,
            DockStatus? status)
        {
            var q = _context.Dock.AsQueryable();

            if (code is not null)
                q = q.Where(d => d.Code.Value == code.Value);

            if (vesselTypeId is not null)
                q = q.Where(d => d.AllowedVesselTypeIds.Any(vt => vt.Value == vesselTypeId.Value));

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower();
                q = q.Where(d => d.Location.ToLower().Contains(loc));
            }

            if (!string.IsNullOrWhiteSpace(query))
            {
                var norm = query.Trim().ToLower();
                q = q.Where(d =>
                    d.Code.Value.ToLower().Contains(norm) ||
                    d.Location.ToLower().Contains(norm) ||
                    d.PhysicalResourceCodes.Any(p => p.Value.ToLower().Contains(norm))
                );
            }

            if (status.HasValue)
                q = q.Where(d => d.Status == status.Value);

            return await q.ToListAsync();
        }

        public async Task<List<DockCode>> GetAllDockCodesAsync()
        {
            return await _context.Dock
                .Select(d => d.Code)
                .ToListAsync();
        }

        public async Task<List<EntityDock>> GetAllDocksForVesselType(VesselTypeId vesselTypeId)
        {
            return await _context.Dock
                .Where(d => d.AllowedVesselTypeIds.Any(vt => vt.Value == vesselTypeId.Value))
                .ToListAsync();
        }
    }
}
