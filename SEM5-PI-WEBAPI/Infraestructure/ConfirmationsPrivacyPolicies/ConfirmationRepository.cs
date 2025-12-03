using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.ConfirmationsPrivacyPolicies;

public class ConfirmationRepository : BaseRepository<ConfirmationPrivacyPolicy,ConfirmationPrivacyPolicyId>, IConfirmationRepository
{
    private readonly DbSet<ConfirmationPrivacyPolicy> _context;

    public ConfirmationRepository(DddSample1DbContext context) : base(context.ConfirmationPrivacyPolicies)
    {
        _context = context.ConfirmationPrivacyPolicies;
    }


    public async Task<ConfirmationPrivacyPolicy?> FindByUserEmailAsync(string email)
    {
        return await _context.FirstOrDefaultAsync(c => c.UserEmail.Equals(email));
    }
}