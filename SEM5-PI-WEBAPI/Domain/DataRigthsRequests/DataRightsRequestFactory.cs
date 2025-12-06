using SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public class DataRightsRequestFactory
{
    public static DataRightRequest ConvertDtoToEntity(DataRightsRequestDto dto)
    {
        return new DataRightRequest(
            dto.UserId,
            dto.UserEmail,
            dto.Type,
            dto.Payload);
    }
}