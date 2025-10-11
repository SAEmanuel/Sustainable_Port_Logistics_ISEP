using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;

public class CreatingPhysicalResourceDTO
{
    public string Description { get; set; }
    public double OperationalCapacity { get; set; }
    public double SetupTime { get; set; }
    public PhysicalResourceType PhysicalResourceType { get; set; }
    public Guid? QualificationID { get; set; }

    public CreatingPhysicalResourceDTO(string description, double operationalCapacity,
        double setupTime, PhysicalResourceType physicalResourceType, Guid? qualificationID)
    {
        Description = description;
        OperationalCapacity = operationalCapacity;
        SetupTime = setupTime;
        PhysicalResourceType = physicalResourceType;
        QualificationID = qualificationID;
    }
}