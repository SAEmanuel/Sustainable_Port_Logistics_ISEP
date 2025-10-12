using System.ComponentModel.DataAnnotations;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;

public class UpdatingPhysicalResource
{
   [MaxLength(80)]
   public string? Description { get; set; }
   
   [Range(0, double.MaxValue, ErrorMessage = "Operational Capacity cannot be negative.")]
   public double? OperationalCapacity { get; set; }
   
   [Range(0, double.MaxValue, ErrorMessage = "Setup Time cannot be negative.")]
   public double? SetupTime { get; set; }
   
   public Guid? QualificationId{ get; set; }

   public UpdatingPhysicalResource()
   {
   }

   public UpdatingPhysicalResource(string? description, double? operationalCapacity, double? setupTime,
      Guid? qualificationId)
   {
      Description = description;
      OperationalCapacity = operationalCapacity;
      SetupTime = setupTime;
      QualificationId = qualificationId;
   }
   
}