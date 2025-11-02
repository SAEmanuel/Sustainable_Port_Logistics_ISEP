using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes;

public interface IVesselTypeService
{
    Task<List<VesselTypeDto>> GetAllAsync();
    Task<VesselTypeDto> GetByIdAsync(VesselTypeId id);
    Task<VesselTypeDto> AddAsync(CreatingVesselTypeDto dto);
    Task<VesselTypeDto> GetByNameAsync(string name);
    Task<List<VesselTypeDto>> GetByDescriptionAsync(string description);
    Task<List<VesselTypeDto>> FilterAsync(string? name, string? description, string? query);
    Task<VesselTypeDto> UpdateAsync(VesselTypeId id, UpdateVesselTypeDto dto);
    Task DeleteAsync(VesselTypeId id);
}
