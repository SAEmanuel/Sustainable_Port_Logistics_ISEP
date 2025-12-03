using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

public class ConfirmationService : IConfirmationService
{
    private readonly IConfirmationRepository _confirmationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmationService(IConfirmationRepository confirmationRepository, IUnitOfWork unitOfWork)
    {
        _confirmationRepository = confirmationRepository;
        _unitOfWork = unitOfWork;
    }
}