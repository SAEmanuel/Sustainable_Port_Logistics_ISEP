using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;

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
    Task<VesselVisitNotificationDto> MarkAsPendingAsync(RejectVesselVisitNotificationDto dto);

    // SAR-scoped
    Task<List<VesselVisitNotificationDto>> GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(Guid idSarWhoImAm, FilterInProgressPendingVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync(Guid idSarWhoImAm, FilterWithdrawnVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(Guid idSarWhoImAm, FilterSubmittedVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(Guid idSarWhoImAm, FilterAcceptedVvnStatusDto dto);

    // ADMIN (ALL)
    Task<List<VesselVisitNotificationDto>> GetInProgressPendingInformationVvnsByFiltersAsync(FilterInProgressPendingVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetWithdrawnVvnsByFiltersAsync(FilterWithdrawnVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetSubmittedVvnsByFiltersAsync(FilterSubmittedVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetAcceptedVvnsByFiltersAsync(FilterAcceptedVvnStatusDto dto);
    Task<List<VesselVisitNotificationDto>> GetAllAcceptedAsync();
}
