using SEM5_PI_DecisionEngineAPI.DTOs;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class QualificationServiceClient
{
    private readonly HttpClient _httpClient;

    public QualificationServiceClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(config["BackendPrimary:BaseUrl"]!);
    }

    public async Task<QualificationDto?> GetQualificationAsync(Guid id)
    {
        var response = await _httpClient.GetAsync($"/api/Qualifications/id/{id}");

        if (!response.IsSuccessStatusCode)
            return null; 

        var dto = await response.Content.ReadFromJsonAsync<QualificationDto>();
        return dto;
    }
}