using SEM5_PI_WEBAPI.Shared;

namespace SEM5_PI_WEBAPI.Shared
{
    /// <summary>
    /// Base class for entities.
    /// </summary>
    public abstract class Entity<TEntityId>
    where TEntityId: EntityId
    {
         public TEntityId Id { get;  protected set; }
    }
}