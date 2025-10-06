using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.StorageAreas;

public class StorageAreaRepository : BaseRepository<StorageArea,StorageAreaId>, IStorageAreaRepository
{
    private readonly DddSample1DbContext _context;
    
    public StorageAreaRepository(DddSample1DbContext context) : base(context.StorageArea)
    {
        _context = context;
    }
}