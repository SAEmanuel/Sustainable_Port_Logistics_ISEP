using SEM5_PI_DecisionEngineAPI.DTOs;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class PhysicalResourceServiceClient
{
    private readonly HttpClient _httpClient;

    public PhysicalResourceServiceClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(config["BackendPrimary:BaseUrl"]!);
    }
    
    public async Task<PhysicalResourceDto?> GetPhysicalResourceByCode(string code)
    {
        var response = await _httpClient.GetAsync($"/api/PhysicalResource/get/code/{code}");

        if (!response.IsSuccessStatusCode)
            return null;

        var dto = await response.Content.ReadFromJsonAsync<PhysicalResourceDto>();
        return dto;
    }

    public async Task<PhysicalResourceDto?> GetAvailableCranes(string type)
    {
        var response = await _httpClient.GetAsync($"/api/PhysicalResource/get/type/{type}");

        if (!response.IsSuccessStatusCode)
            return null;

        var dto = await response.Content.ReadFromJsonAsync<PhysicalResourceDto>();
        return dto;
    }
}