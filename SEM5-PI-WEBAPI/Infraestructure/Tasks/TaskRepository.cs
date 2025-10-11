using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.Tasks;

public class TaskRepository : BaseRepository<SEM5_PI_WEBAPI.Domain.Tasks.Task, TaskId>, ITaskRepository
{
    private readonly DbSet<SEM5_PI_WEBAPI.Domain.Tasks.Task> _tasks;

    public TaskRepository(DddSample1DbContext context) : base(context.Tasks)
    {
        _tasks = context.Tasks;
    }

    public async Task<int> CountAsync()
    {
        return await _tasks.CountAsync();
    }
}