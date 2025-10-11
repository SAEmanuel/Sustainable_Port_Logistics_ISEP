using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Tasks;

public class Task : Entity<TaskId>
{
    public TaskCode Code { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Description { get; set; }
    public TaskType Type { get; set; }
    public TaskStatus Status { get; set; }

    public Task(TaskCode code, DateTime startTime, DateTime endTime, string? description, TaskType type)
    {
        if (startTime >= endTime)
            throw new BusinessRuleValidationException("StartTime must be before EndTime.");
        if (description != null && description.Length > 255)
            throw new BusinessRuleValidationException("Description length must be at most 255 characters.");
        Code = code;
        StartTime = startTime;
        EndTime = endTime;
        Description = description;
        Type = type;
        Status = TaskStatus.Pending;
    }
}