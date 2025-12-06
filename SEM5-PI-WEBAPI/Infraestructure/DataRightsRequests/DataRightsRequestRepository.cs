using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.DataRigthsRequests;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.DataRightsRequests;

public class DataRightsRequestRepository : BaseRepository<DataRightRequest, DataRightRequestId>,
    IDataRightRequestRepository
{
    private readonly DbSet<DataRightRequest> _context;

    public DataRightsRequestRepository(DddSample1DbContext context) : base(context.DataRightRequest)
    {
        _context = context.DataRightRequest;
    }


    public async Task<DataRightRequest?> CheckIfUserHasANonFinishRequestByType(string userEmail,
        RequestType requestType)
    {
        return await _context.FirstOrDefaultAsync(r =>
            r.UserEmail == userEmail &&
            r.Type == requestType &&
            (
                r.Status == RequestStatus.WaitingForAssignment ||
                r.Status == RequestStatus.InProgress
            )
        );
    }

    public async Task<DataRightRequest?> GetRequestByIdentifier(string requestIdentifier)
    {
        return await _context.FirstOrDefaultAsync(r => r.RequestId.Equals(requestIdentifier));
    }

    public async Task<List<DataRightRequest>> GetAllDataRightRequestsWithStatusWaitingForAssignment()
    {
        return await _context.Where(r => r.Status == RequestStatus.WaitingForAssignment).ToListAsync(); 
    }
}