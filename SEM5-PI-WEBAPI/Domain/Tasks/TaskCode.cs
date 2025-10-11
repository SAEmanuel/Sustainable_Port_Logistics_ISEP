using System;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Tasks;

public class TaskCode : IValueObject
{
    public string Value { get; private set; }
    public TaskType Type { get; private set; }

    public TaskCode(TaskType type, int number)
    {
        if (number <= 0)
            throw new BusinessRuleValidationException("Task code number must be positive.");

        Type = type;
        Value = GenerateCode(type, number);
    }

    private static string GenerateCode(TaskType type, int number)
    {
        string prefix = type switch
        {
            TaskType.ContainerHandling => "CH",
            TaskType.YardTransport => "YT",
            TaskType.StoragePlacement => "SP",
            _ => throw new BusinessRuleValidationException("Invalid task type for code generation.")
        };

        return $"{prefix}-{number:D4}";
    }

    public override bool Equals(object? obj)
    {
        if (obj is TaskCode other)
            return Value == other.Value && Type == other.Type;
        return false;
    }

    public override int GetHashCode() => HashCode.Combine(Value, Type);

    public override string ToString() => Value;
}