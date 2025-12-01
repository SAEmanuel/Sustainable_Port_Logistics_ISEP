using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.PrivatePolicies;

public class PrivacyPolicyRepository : BaseRepository<PrivacyPolicy, PrivacyPolicyId>, IPrivacyPolicyRepository
{
    private readonly DddSample1DbContext _context;

    public PrivacyPolicyRepository(DddSample1DbContext context) : base(context.PrivacyPolicy)
    {
        _context = context;
    }

    public async Task<PrivacyPolicy?> GetPrivacyPolicyByVersion(string version)
    {
        return await _context.PrivacyPolicy
            .AsNoTracking()
            .FirstOrDefaultAsync(pp => pp.Version == version);
    }
}