using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.Containers;

public class ContainerRepository: BaseRepository<EntityContainer,ContainerId>, IContainerRepository
{
    private readonly DddSample1DbContext _context;
    
    public ContainerRepository(DddSample1DbContext context) : base(context.Container)
    {
        _context = context;
    }


    public async Task<EntityContainer?> GetByIsoNumberAsync(Iso6346Code iso)
    {
        return await _context.Container.FirstOrDefaultAsync(c => c.ISOId.Value == iso.Value);
    }
}