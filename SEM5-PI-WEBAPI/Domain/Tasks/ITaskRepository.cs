using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Tasks;

public interface ITaskRepository : IRepository<Task, TaskId>
{
    Task<int> CountAsync();
}