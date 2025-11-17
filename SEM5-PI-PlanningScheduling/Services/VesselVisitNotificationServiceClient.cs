using SEM5_PI_DecisionEngineAPI.DTOs;
using SEM5_PI_DecisionEngineAPI.Mappers;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class VesselVisitNotificationServiceClient
{
    private readonly HttpClient _httpClient;

    public VesselVisitNotificationServiceClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(config["BackendPrimary:BaseUrl"]!);
    }

    
    public async Task<List<VesselVisitNotificationPSDto>> GetVisitNotifications()
    {
        var fullList = await _httpClient
            .GetFromJsonAsync<List<VesselVisitNotificationDto>>("/api/VesselVisitNotification");

        if (fullList == null)
            return new List<VesselVisitNotificationPSDto>();

        return fullList
            .Select(VesselVisitNotificationMapper.ToPSDto)
            .ToList();
    }
}