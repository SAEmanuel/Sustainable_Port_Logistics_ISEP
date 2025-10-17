using SEM5_PI_WEBAPI.Domain.Dock.DTOs;

namespace SEM5_PI_WEBAPI.Domain.Dock;

public interface IDockService
{
    Task<List<DockDto>> GetAllAsync();
    Task<DockDto> CreateAsync(RegisterDockDto dto);
    Task<DockDto> GetByIdAsync(DockId id);
    Task<DockDto> GetByCodeAsync(string codeString);
    Task<DockDto> GetByPhysicalResourceCodeAsync(string codeString);
    Task<List<DockDto>> GetByVesselTypeAsync(string vesselTypeId);

    Task<List<DockDto>> GetFilterAsync(string? code, string? vesselTypeId, string? location, string? query,
        string? status);
    Task<List<DockDto>> GetByLocationAsync(string location);
    Task<List<string>> GetAllDockCodesAsync();
    Task<DockDto> PatchByCodeAsync(string codeString, UpdateDockDto dto);
}