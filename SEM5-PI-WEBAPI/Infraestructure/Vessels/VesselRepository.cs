using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.Vessels;

public class VesselRepository : BaseRepository<Vessel,VesselId> , IVesselRepository
{
    private readonly DddSample1DbContext _context;
    
    public VesselRepository(DddSample1DbContext context) : base(context.Vessel)
    {
        _context = context;
    }


    public async Task<Vessel?> GetByImoNumberAsync(ImoNumber imoNumber)
    {
        return await _context.Vessel
            .FirstOrDefaultAsync(v => v.ImoNumber.Value == imoNumber.Value);
    }

    public async Task<List<Vessel>> GetByNameAsync(string name)
    {
        return await _context.Vessel
            .Where(v => v.Name.Trim().ToLower() == name.Trim().ToLower()).ToListAsync<Vessel>();
    }

    public async Task<List<Vessel>> GetByOwnerAsync(string ownerName)
    {
        return await _context.Vessel
            .Where(v => v.Owner.Trim().ToLower() == ownerName.Trim().ToLower()).ToListAsync<Vessel>();
    }

    public async Task<List<Vessel>> GetFilterAsync(string? name, ImoNumber? imoNumber, string? ownerName, string? query)
    {
        var normalizedName = name?.Trim().ToLower();
        var normalizedOwnerName = ownerName?.Trim().ToLower();
        var normalizedQuery = query?.Trim().ToLower();

        var queryable = _context.Vessel.AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedName))
            queryable = queryable.Where(v => v.Name.ToLower().Trim().Contains(normalizedName));
    
        if (!string.IsNullOrWhiteSpace(normalizedOwnerName))
            queryable = queryable.Where(v => v.Owner.Trim().ToLower().Contains(normalizedOwnerName));
        
        if (imoNumber != null)
            queryable = queryable.Where(v => v.ImoNumber.Value == imoNumber.Value);
        
        if (!string.IsNullOrWhiteSpace(normalizedQuery))
            queryable = queryable.Where(v => v.Name.ToLower().Trim().Contains(normalizedQuery) || v.Owner.ToLower().Trim().Contains(normalizedQuery) || v.ImoNumber.Value.ToString().Contains(normalizedQuery));
        
        return await queryable.ToListAsync();
    }

}