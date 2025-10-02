using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.VesselsTypes
{
    public class VesselTypeRepository : BaseRepository<VesselType, VesselTypeId>, IVesselTypeRepository
    {
        public VesselTypeRepository(DddSample1DbContext context) : base(context.VesselType)
        {
        }
    }
}

