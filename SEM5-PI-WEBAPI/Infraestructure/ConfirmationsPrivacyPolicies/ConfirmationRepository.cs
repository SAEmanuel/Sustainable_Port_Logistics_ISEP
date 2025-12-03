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
    
    
    
}