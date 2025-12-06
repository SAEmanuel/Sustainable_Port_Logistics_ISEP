using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;

public class DataRightsRequestDto
{
    public Guid Id { get; set; }
    public string RequestId { get; set;}
    
    public string UserId { get;set;}
    public string UserEmail { get;set;}
    
    public RequestType Type { get; set; }
    public RequestStatus Status { get; set; }

    public string? Payload { get;set;}
    
    public ClockTime CreatedOn { get; set;}
    public ClockTime? UpdatedOn { get; set; }
    
    public string? ProcessedBy { get; set; }
    
    // Empty constructor for DB.
    public DataRightsRequestDto(){}
}