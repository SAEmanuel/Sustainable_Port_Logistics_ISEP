using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

public interface IConfirmationRepository: IRepository<ConfirmationPrivacyPolicy, ConfirmationPrivacyPolicyId>
{
    Task<ConfirmationPrivacyPolicy?> FindByUserEmailAsync(string email);
}