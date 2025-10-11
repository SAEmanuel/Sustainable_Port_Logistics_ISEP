namespace SEM5_PI_WEBAPI.Domain.Tasks;

public enum TaskStatus
{
    Pending,        // Task is created but not started
    InProgress,     // Task is currently being executed
    Completed,      // Task finished successfully
    Cancelled,      // Task was cancelled and will not be completed
}