using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public enum RequestStatus
{
    WaitingForAssignment,
   InProgress,
   Completed,
   Rejected, 
}

public enum RequestType
{
   Access,
   Deletion,
   Rectification
}

public class DataRightRequest : Entity<DataRightRequestId>, IAggregateRoot
{
    public string RequestId { get; }
    
    public string UserId { get;}
    public string UserEmail { get;}
    
    public RequestType Type { get;}
    public RequestStatus Status { get; private set; }

    public string? Payload { get;}
    
    public ClockTime CreatedOn { get;}
    public ClockTime? UpdatedOn { get; private set; }
    
    public string? ProcessedBy { get; private set; }
    
    
    private DataRightRequest() { }

    public DataRightRequest(string userId, string userEmail,RequestType requestType, string? payload)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new BusinessRuleValidationException("UserId is required.");
        if (string.IsNullOrWhiteSpace(userEmail))
            throw new BusinessRuleValidationException("UserEmail is required.");

        this.Id = new DataRightRequestId(Guid.NewGuid());
     
        this.UserId = userId;
        this.UserEmail = userEmail;
        
        this.Type = requestType;
        this.Status = RequestStatus.WaitingForAssignment;
        
        if(Type == RequestType.Access && payload != null) throw new BusinessRuleValidationException("An 'Access' type request does not accept payload information.");
        
        this.Payload = payload;
        
        this.UpdatedOn = null;
        
        this.ProcessedBy = null;
        
        var now = DateTime.UtcNow;
        this.CreatedOn = new ClockTime(now);

        var localPart = userEmail.Contains('@')
            ? userEmail.Split('@').First()
            : userEmail;

        this.RequestId = $"{localPart}-{requestType}-{now:yyyyMMddHHmmss}";

    }


    public bool IsCompleted() {return this.Status == RequestStatus.Completed; }
    public bool IsRejected(){return this.Status == RequestStatus.Rejected;}


    public void MarkAsCompleted()
    {
        if (ProcessedBy == null) throw new BusinessRuleValidationException("Cannot mark as 'Completed' because an admin must be assigned to this request first.");
        
        if (Status == RequestStatus.Rejected) throw new BusinessRuleValidationException("Cannot complete a request that is already rejected.");
        
        this.Status = RequestStatus.Completed;
        this.UpdatedOn = new ClockTime(DateTime.UtcNow);
    }

    public void MarkAsRejected()
    {
        if (ProcessedBy == null) throw new BusinessRuleValidationException("Cannot mark as 'rejected' because an admin must be assigned to this request first");
        
        if (Status == RequestStatus.Completed) throw new BusinessRuleValidationException("Cannot reject a request that is already completed.");
        
        this.Status = RequestStatus.Rejected;
        this.UpdatedOn = new ClockTime(DateTime.UtcNow);
    }

    public void MarkAsInProgress()
    {
        if (ProcessedBy == null)
            throw new BusinessRuleValidationException("Cannot mark as 'InProgress' because an admin must be assigned to this request first.");
    
        if (Status == RequestStatus.Completed)
            throw new BusinessRuleValidationException("Cannot mark as 'InProgress' a request that is already completed.");
    
        if (Status == RequestStatus.Rejected)
            throw new BusinessRuleValidationException("Cannot mark as 'InProgress' a request that is already rejected.");

        this.Status = RequestStatus.InProgress;
        this.UpdatedOn = new ClockTime(DateTime.UtcNow);
    }


    public string AssignResponsibleToRequest(string processedBy)
    {
        if (string.IsNullOrWhiteSpace(processedBy))
            throw new BusinessRuleValidationException("ProcessedBy cannot be empty.");

        this.ProcessedBy = processedBy;
        MarkAsInProgress();
        
        return this.RequestId;
    }

    
}