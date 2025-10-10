using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.PhysicalResources
{
    public class PhysicalResourceRepository : BaseRepository<EntityPhysicalResource, PhysicalResourceId>, IPhysicalResourceRepository
    {
        private readonly DbSet<EntityPhysicalResource> _context;

        public PhysicalResourceRepository(DddSample1DbContext context) : base(context.PhysicalResources)
        {
            _context = context.PhysicalResources;
        }

        public async Task<List<EntityPhysicalResource>> GetAllAsync()
        {
            return await _context.ToListAsync();
        }

        public async Task<EntityPhysicalResource?> GetByIdAsync(PhysicalResourceId id)
        {
            return await _context.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<EntityPhysicalResource>> GetByStatusAsync(PhysicalResourceStatus status)
        {
            return await _context
                .Where(r => r.Status == status)
                .ToListAsync();
        }

        public async Task<List<EntityPhysicalResource>> GetByTypeAsync(PhysicalResourceType type)
        {
            return await _context
                .Where(r => r.Type == type)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(PhysicalResourceId id)
        {
            return await _context.AnyAsync(r => r.Id == id);
        }
    }
}