namespace SEM5_PI_DecisionEngineAPI.Services;

public class PrologClient
{
    private readonly HttpClient _httpClient;

    public PrologClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(config["PrologServer:BaseUrl"]!);
    }

    public async Task<T?> SendToPrologAsync<T>(string endpoint, object payload)
    {
        var response = await _httpClient.PostAsJsonAsync(endpoint, payload);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<T>();
    }
}