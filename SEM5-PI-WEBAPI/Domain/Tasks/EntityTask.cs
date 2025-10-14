using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Tasks;

public class EntityTask : Entity<TaskId>
{
    public TaskCode Code { get; private set; }
    public DateTime? StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public string? Description { get; private set; }
    public TaskType Type { get; private set; }
    public TaskStatus Status { get; private set; }

    protected EntityTask() {
    }

    public EntityTask(TaskCode code, string? description, TaskType type)
    {
        if (description != null && description.Length > 255)
            throw new BusinessRuleValidationException("Description length must be at most 255 characters.");

        Code = code;
        Description = description;
        Type = type;
        Status = TaskStatus.Pending;
        Id = new TaskId(Guid.NewGuid());
    }

    public EntityTask(TaskCode code, DateTime startTime, string? description, TaskType type)
    {
        if (description != null && description.Length > 255)
            throw new BusinessRuleValidationException("Description length must be at most 255 characters.");

        Code = code;
        StartTime = startTime;
        Description = description;
        Type = type;
        Status = TaskStatus.InProgress;
    }

    public void SetEndTime(DateTime endTime)
    {
        if (StartTime != null && endTime <= StartTime)
            throw new BusinessRuleValidationException("EndTime must be after StartTime.");

        EndTime = endTime;
        Status = TaskStatus.Completed;
    }

    public override bool Equals(object? obj)
    {
        if (obj is not EntityTask other)
            return false;

        return Code.Equals(other.Code);
    }

    public override int GetHashCode()
    {
        return Code.GetHashCode();
    }

    public override string ToString()
    {
        return $"{Code} [{Status}] ({StartTime?.ToString() ?? "N/A"} - {EndTime?.ToString() ?? "N/A"})";
    }
}