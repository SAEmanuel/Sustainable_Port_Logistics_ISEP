using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.VesselsTypes
{
    public class VesselTypeRepository : BaseRepository<VesselType, VesselTypeId>, IVesselTypeRepository
    {
        private readonly DddSample1DbContext _context;
        public VesselTypeRepository(DddSample1DbContext context) : base(context.VesselType)
        {
            _context = context;
        }

        public async Task<VesselType?> GetByNameAsync(string name)
        {
            return await _context.VesselType
                .FirstOrDefaultAsync(x => x.Name.ToLower().Trim() == name.ToLower().Trim());
        }
        
        public async Task<List<VesselType>> GetByDescriptionAsync(string description)
        {
            return await _context.VesselType
                .Where(x => x.Description.ToLower().Trim() == description.ToLower().Trim()).ToListAsync();
        }

        public async Task<List<VesselType>> FilterAsync(string? name, string? description, string? query)
        {
            var normalizedName = name?.Trim().ToLower();
            var normalizedDesc = description?.Trim().ToLower();
            var normalizedQuery = query?.Trim().ToLower();

            var queryable = _context.VesselType.AsQueryable();

            if (!string.IsNullOrEmpty(normalizedName))
                queryable = queryable.Where(v => v.Name.ToLower().Contains(normalizedName));

            if (!string.IsNullOrEmpty(normalizedDesc))
                queryable = queryable.Where(v => v.Description.ToLower().Contains(normalizedDesc));

            if (!string.IsNullOrEmpty(normalizedQuery))
                queryable = queryable.Where(v =>
                    v.Name.ToLower().Contains(normalizedQuery) ||
                    v.Description.ToLower().Contains(normalizedQuery));

            return await queryable.ToListAsync();
        }

    }
}

