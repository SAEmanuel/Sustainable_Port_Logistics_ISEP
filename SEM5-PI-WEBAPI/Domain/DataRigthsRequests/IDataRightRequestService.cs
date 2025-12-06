using SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public interface IDataRightRequestService
{
    Task<DataRightsRequestDto> CreateDataRightRequest(DataRightsRequestDto dto);
    
    // ------ Admin
    Task<DataRightsRequestDto> AssignResponsibleToDataRightRequestAsync(string requestId, string responsibleEmail);
    Task<List<DataRightsRequestDto>> GetAllDataRightRequestsWithStatusWaitingForAssignment();
    
}