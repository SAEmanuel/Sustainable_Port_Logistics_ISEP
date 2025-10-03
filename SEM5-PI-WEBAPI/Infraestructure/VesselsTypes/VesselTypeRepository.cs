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

    }
}

