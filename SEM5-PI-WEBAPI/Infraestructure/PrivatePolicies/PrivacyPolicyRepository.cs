using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.PrivatePolicies;

public class PrivacyPolicyRepository 
    : BaseRepository<PrivacyPolicy, PrivacyPolicyId>, IPrivacyPolicyRepository
{
    private readonly DddSample1DbContext _context;

    public PrivacyPolicyRepository(DddSample1DbContext context) 
        : base(context.PrivacyPolicy)
    {
        _context = context;
    }

    public async Task<PrivacyPolicy?> GetPrivacyPolicyByVersion(string version)
    {
        return await _context.PrivacyPolicy
            .AsNoTracking()
            .FirstOrDefaultAsync(pp => pp.Version == version);
    }

    public async Task<PrivacyPolicy?> GetCurrentByStatusPrivacyPolicy()
    {
        return await _context.PrivacyPolicy.FirstOrDefaultAsync(pp => pp.IsCurrent);
    }

    public async Task<PrivacyPolicy?> GetCurrentByTimePrivacyPolicy()
    {
        var nowUtc = DateTime.UtcNow;

        return await _context.PrivacyPolicy
            .Where(pp => pp.EffectiveFrom != null && pp.EffectiveFrom.Value <= nowUtc)
            .OrderByDescending(pp => pp.EffectiveFrom!.Value)
            .FirstOrDefaultAsync();
    }

    public async Task<List<PrivacyPolicy>> GetAllTrackedAsync()
    {
        return await _context.PrivacyPolicy.ToListAsync();
    }
}