using SEM5_PI_DecisionEngineAPI.DTOs;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class DockServiceClient
{
    public const string StsCrane = "STSCrane";
    public const string YgCrane = "YGCrane";
    public const string MCrane = "MCrane";
    
    private readonly HttpClient _httpClient;

    public DockServiceClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(config["BackendPrimary:BaseUrl"]!);
    }

    public async Task<List<PhysicalResourceDto>> GetDockCranesAsync(string dockCode)
    {
        var response = await _httpClient.GetAsync($"/api/Dock/code/{dockCode}");

        if (!response.IsSuccessStatusCode)
            return new List<PhysicalResourceDto>();
        
        var dock = await response.Content.ReadFromJsonAsync<DockDto>();
        if (dock == null)
            return new List<PhysicalResourceDto>();

        var resourceCodes = dock.PhysicalResourceCodes?
            .Select(rc => rc.Value)
            .ToList() ?? new List<string>();

        if (resourceCodes.Count == 0)
            return new List<PhysicalResourceDto>();

        var resources = new List<PhysicalResourceDto>();

        foreach (var code in resourceCodes)
        {
            var r = await _httpClient
                .GetFromJsonAsync<PhysicalResourceDto>($"/api/PhysicalResource/get/code/{code}");

            if (r != null)
                resources.Add(r);
        }

        var craneTypes = new HashSet<string>
        {
            StsCrane,
            YgCrane,
            MCrane
        };

        var cranes = resources
            .Where(r => craneTypes.Contains(r.PhysicalResourceType))
            .ToList();

        if (cranes.Count == 0)
            return new List<PhysicalResourceDto>();

        var random = new Random();
        var chosenCrane = cranes[random.Next(cranes.Count)];

        return new List<PhysicalResourceDto> { chosenCrane };
    }
}