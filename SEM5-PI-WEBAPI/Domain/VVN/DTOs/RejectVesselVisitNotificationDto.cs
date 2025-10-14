namespace SEM5_PI_WEBAPI.Domain.VVN.DTOs;

public class RejectVesselVisitNotificationDto
{
    public string VvnCode { get; set; }
    public string Reason { get; set; }

    public RejectVesselVisitNotificationDto(string vvnCode, string reason)
    {
        VvnCode = vvnCode;
        Reason = reason;
    }
}