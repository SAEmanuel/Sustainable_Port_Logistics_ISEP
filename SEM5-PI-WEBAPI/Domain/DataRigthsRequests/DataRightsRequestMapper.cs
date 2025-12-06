using SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public class DataRightsRequestMapper
{
    public static DataRightsRequestDto CreateDataRightsRequestDto(DataRightRequest entity)
    {
        return new DataRightsRequestDto
        {
            Id = entity.Id.AsGuid(),
            RequestId = entity.RequestId,
            UserId = entity.UserId,
            UserEmail = entity.UserEmail,
            Type = entity.Type,
            Status = entity.Status,
            Payload = entity.Payload,
            CreatedOn = entity.CreatedOn,
            UpdatedOn = entity.UpdatedOn,
            ProcessedBy = entity.ProcessedBy
        };
    }
}