using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public interface IDataRightRequestRepository : IRepository<DataRightRequest, DataRightRequestId>
{
    Task<DataRightRequest?> CheckIfUserHasANonFinishRequestByType(string userEmail,RequestType requestType);
    Task<DataRightRequest?> GetRequestByIdentifier(string requestIdentifier);
    Task<List<DataRightRequest>> GetAllDataRightRequestsWithStatusWaitingForAssignment();
}