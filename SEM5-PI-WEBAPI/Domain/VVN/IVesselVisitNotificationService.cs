using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public interface IVesselVisitNotificationService
{
        Task<VesselVisitNotificationDto> AddAsync(CreatingVesselVisitNotificationDto dto);
        Task<VesselVisitNotificationDto> GetByIdAsync(VesselVisitNotificationId id);
        Task<VesselVisitNotificationDto> WithdrawByIdAsync(VesselVisitNotificationId id);
        Task<VesselVisitNotificationDto> WithdrawByCodeAsync(VvnCode code);
        Task<VesselVisitNotificationDto> SubmitByIdAsync(VesselVisitNotificationId id);
        Task<VesselVisitNotificationDto> SubmitByCodeAsync(VvnCode code);
        Task<VesselVisitNotificationDto> UpdateAsync(VesselVisitNotificationId id, UpdateVesselVisitNotificationDto dto);
        Task<VesselVisitNotificationDto> AcceptVvnAsync(VvnCode code);
        Task<VesselVisitNotificationDto> MarkAsPendingAsync(VvnCode code, string reason);

}