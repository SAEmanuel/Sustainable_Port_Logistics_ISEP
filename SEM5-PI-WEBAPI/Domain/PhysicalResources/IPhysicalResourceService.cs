using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources
{
    public interface IPhysicalResourceService
    {
        Task<List<PhysicalResourceDTO>> GetAllAsync();
        Task<PhysicalResourceDTO> GetByIdAsync(PhysicalResourceId id);
        Task<PhysicalResourceDTO> GetByCodeAsync(PhysicalResourceCode code);
        Task<List<PhysicalResourceDTO>> GetByDescriptionAsync(string description);
        Task<List<PhysicalResourceDTO>> GetByQualificationAsync(QualificationId qualification);
        Task<List<PhysicalResourceDTO>> GetByTypeAsync(PhysicalResourceType type);
        Task<List<PhysicalResourceDTO>> GetByStatusAsync(PhysicalResourceStatus status);
        Task<List<PhysicalResourceDTO>> GetByPartialCodeAsync(String partialCode);
        Task<List<PhysicalResourceDTO>> GetByPartialDescriptionAsync(String partialDescription);

        Task<PhysicalResourceDTO> AddAsync(CreatingPhysicalResourceDto dto);
        Task<PhysicalResourceDTO> UpdateAsync(PhysicalResourceId id, UpdatingPhysicalResource dto);
        Task<PhysicalResourceDTO> DeactivationAsync(PhysicalResourceId id);
        Task<PhysicalResourceDTO> ReactivationAsync(PhysicalResourceId id);
    }
}