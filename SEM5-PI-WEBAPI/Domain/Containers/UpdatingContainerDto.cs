namespace SEM5_PI_WEBAPI.Domain.Containers;

public class UpdatingContainerDto
{
    public string? Description { get; private set; }
    public ContainerType? Type { get; private set; }
    public ContainerStatus? Status { get; private set; }
    public double? WeightKg { get; private set; }

    public UpdatingContainerDto(string? description, ContainerType? type, ContainerStatus? status, double? weightKg)
    {
        Description = description;
        Type = type;
        Status = status;
        WeightKg = weightKg;
    }
}