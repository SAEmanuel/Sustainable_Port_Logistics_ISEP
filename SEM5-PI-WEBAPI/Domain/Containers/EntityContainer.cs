using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;


namespace SEM5_PI_WEBAPI.Domain.Containers;

public enum ContainerType
{
    Dry,        
    Reefer,     
    Tank,       
    OpenTop,    
    FlatRack  
}
public enum ContainerStatus
{
    Empty,
    Full,
    Reserved,
    Damaged,
    InTransit
}

public class EntityContainer : Entity<ContainerId>, IAggregateRoot
{
    private const double MinContainerWeigth = 0D;
    private const int MinDescriptionLength = 10;
    private const int MaxDescriptionLength = 150;
    private const ContainerStatus DefaultContainerStatus = ContainerStatus.Empty;
    
    public Iso6346Code ISOId { get; private set; }
    public string Description { get; private set; }
    public ContainerType Type { get; private set; }
    public ContainerStatus Status { get; private set; }
    public double WeightKg { get; private set; } 
    

    protected EntityContainer() { }

    public EntityContainer(string isoCode, string description, ContainerType type, double weightKg)
    {
        this.Id = new ContainerId(Guid.NewGuid());
        this.ISOId = new Iso6346Code(isoCode);
        SetContainerDescription(description);
        SetContainerWeightKg(weightKg);
        this.Type = type;
        this.Status = DefaultContainerStatus;
    }

    public void ChangeStatus(ContainerStatus status) => SetContainerStatus(status);
    public void ChangeWeightKg(double weightKg) => SetContainerWeightKg(weightKg);
    
    
    private void SetContainerWeightKg(double weightKg)
    {
        if(weightKg < MinContainerWeigth) throw new BusinessRuleValidationException($"Weight of container must be greater than [{MinContainerWeigth}].");
        
        this.WeightKg = weightKg;
    }
    
    
    private void SetContainerStatus(ContainerStatus status)
    {
        this.Status = status;
    }

    private void SetContainerDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description)) throw new BusinessRuleValidationException("Description can't be null or whitespace.");
        if (description.Length < MinDescriptionLength) throw new BusinessRuleValidationException($"Description must be at least {MinDescriptionLength} characters long.");
        if (description.Length > MaxDescriptionLength) throw new BusinessRuleValidationException($"Description can't be more than {MaxDescriptionLength} characters long.");
        
        this.Description = description;
    }
    
    
    public override bool Equals(object? obj) =>
        obj is EntityContainer otherContainer && this.Id.Equals(otherContainer.Id) && String.Equals(ISOId, otherContainer.ISOId);

    public override int GetHashCode() => Id.GetHashCode();

    public override string ToString() => $"Container [{ISOId}] - {Description} ({Type}) Status: {Status} Weight: {WeightKg})";
}
