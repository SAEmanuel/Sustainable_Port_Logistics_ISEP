using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources;

public enum PhysicalResourceStatus
{
    Available,
    Unavailable,
    UnderMaintenance,
}

public class EntityPhysicalResource : Entity<PhysicalResourceId>, IAggregateRoot
{
    private const int MaxDescription = 80;
    
    
    [MaxLength(10)] public PhysicalResourceCode Code { get; set; }

    [MaxLength(80)] public string Description { get; set; }

    public double OperationalCapacity { get; set; }

    public double SetupTime { get; set; }

    public PhysicalResourceType Type { get; set; }

    public PhysicalResourceStatus Status { get; set; }
    
    public QualificationId? QualificationID { get; set; }


    protected EntityPhysicalResource()
    {
    }

    public EntityPhysicalResource(PhysicalResourceCode code, string description, double operationalCapacity,
        double setupTime, PhysicalResourceType type, QualificationId? qualificationID)
    {
        Id = new PhysicalResourceId(Guid.NewGuid());
        SetCode(code);
        SetDescription(description);
        SetOperationalCapacity(operationalCapacity);
        SetSetupTime(setupTime);
        SetType(type);
        Status = PhysicalResourceStatus.Available;
        SetQualification(qualificationID);
        
    }
    
    private void SetCode(PhysicalResourceCode code)
    {
        if (code == null)
            throw new BusinessRuleValidationException("Code cannot be null");
        Code = code;
    }

    private void SetDescription(string description)
    {
        if (string.IsNullOrEmpty(description))
            throw new BusinessRuleValidationException("Description cannot be null or whitespace");
        
        if (description.Length > MaxDescription)
            throw new BusinessRuleValidationException("Description cannot be longer than " + MaxDescription);
        
        Description = description;
    }

    private void SetOperationalCapacity(double operationalCapacity)
    {
        if (operationalCapacity < 0)
            throw new BusinessRuleValidationException("Operational capacity cannot be negative");
        
        OperationalCapacity = operationalCapacity;
    }

    private void SetSetupTime(double setupTime)
    {
        if (setupTime < 0)
            throw new BusinessRuleValidationException("Setup time cannot be negative");
        
        SetupTime = setupTime;
    }

    private void SetType(PhysicalResourceType type)
    {
        if (!Enum.IsDefined(typeof(PhysicalResourceType), type))
            throw new BusinessRuleValidationException($"Invalid type '{type}'.");

        Type = type;
    }

    private void SetStatus(PhysicalResourceStatus status)
    {
        if (!Enum.IsDefined(typeof(PhysicalResourceStatus), status))
            throw new BusinessRuleValidationException($"Invalid status '{status}'.");
        
        Status = status;
    }
    
    private void SetQualification(QualificationId? qualificationId)
    {
        QualificationID = qualificationId;
    }

    public void UpdateDescription(string description) => SetDescription(description);
    public void UpdateOperationalCapacity(double operationalCapacity) => SetOperationalCapacity(operationalCapacity);
    public void UpdateSetupTime(double setupTime) => SetSetupTime(setupTime);
    public void UpdateStatus(PhysicalResourceStatus status) => SetStatus(status);
    public void UpdateQualification(QualificationId qualificationId) => SetQualification(qualificationId);

    
    public override bool Equals(object? obj)
    {
        if (obj is EntityPhysicalResource other)
            return Id == other.Id;
        return false;
    }
    
    public override int GetHashCode()  => Id.GetHashCode();
    
    public override string ToString()
    {
        return $"[{Code?.Value}] {Description} | Type: {Type} | Status: {Status} | Capacity: {OperationalCapacity} | Setup: {SetupTime}";
    }

}
