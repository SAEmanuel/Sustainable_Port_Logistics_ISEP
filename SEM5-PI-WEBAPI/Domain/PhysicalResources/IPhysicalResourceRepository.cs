using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources;

public interface IPhysicalResourceRepository : IRepository<EntityPhysicalResource, PhysicalResourceId>
{
    Task<bool> ExistsAsync(PhysicalResourceId id);
    Task<List<EntityPhysicalResource>> GetByStatusAsync(PhysicalResourceStatus status);
    Task<List<EntityPhysicalResource>> GetByTypeAsync(PhysicalResourceType type);
}