using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources;

public interface IPhysicalResourceRepository : IRepository<EntityPhysicalResource, PhysicalResourceId>
{
    Task<bool> ExistsAsync(PhysicalResourceId id);
    Task<List<EntityPhysicalResource>> GetByStatusAsync(PhysicalResourceStatus status);
    Task<List<EntityPhysicalResource>> GetByTypeAsync(PhysicalResourceType type);
    Task<List<EntityPhysicalResource>> GetByDescriptionAsync(string description);
    Task<List<EntityPhysicalResource>> GetByQualificationAsync(QualificationId qualification);
    Task<int> CountByTypeAsync(PhysicalResourceType type);
    Task<EntityPhysicalResource?> GetByCodeAsync(PhysicalResourceCode code);
    Task<List<EntityPhysicalResource>> SearchByPartialCodeAsync(string partialCode);
    Task<List<EntityPhysicalResource>> SearchByPartialDescriptionAsync(string partialDescription);

}