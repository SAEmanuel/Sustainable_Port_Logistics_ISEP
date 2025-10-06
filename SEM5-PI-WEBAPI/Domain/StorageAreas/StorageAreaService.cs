using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Vessels;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<VesselService> _logger;

    public StorageAreaService(IUnitOfWork unitOfWork, ILogger<VesselService> logger)
    {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
    }
}