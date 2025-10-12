using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;


namespace SEM5_PI_WEBAPI.Domain.Vessels
{
    public interface IVesselService
    {
        Task<List<VesselDto>> GetAllAsync();

        Task<VesselDto> CreateAsync(CreatingVesselDto creatingVesselDto);

        Task<VesselDto> GetByIdAsync(VesselId vesselId);

        Task<VesselDto> GetByImoNumberAsync(string imoNumberString);

        Task<List<VesselDto>> GetByNameAsync(string name);

        Task<List<VesselDto>> GetByOwnerAsync(string ownerName);

        Task<List<VesselDto>> GetFilterAsync(string? name, string? imo, string? ownerName, string? query);

        Task<VesselDto> PatchByImoAsync(string imo, UpdatingVesselDto dto);
    }
}