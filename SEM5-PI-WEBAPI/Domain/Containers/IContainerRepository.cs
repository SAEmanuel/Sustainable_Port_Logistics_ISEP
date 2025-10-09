using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Containers;

public interface IContainerRepository: IRepository<EntityContainer,ContainerId>
{
    Task<EntityContainer> GetByIsoNumberAsync(Iso6346Code imo);
}