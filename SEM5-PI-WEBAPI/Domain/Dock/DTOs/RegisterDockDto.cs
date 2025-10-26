using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock.DTOs
{
    public class RegisterDockDto
    {
        public string Code { get; set; } = null!;
        public List<string> PhysicalResourceCodes { get; set; } = new();
        //public List<PhysicalResourceCode> PhysicalResourceCodesList { get; set; } 
        public string Location { get; set; } = null!;
        public double LengthM  { get; set; }
        public double DepthM   { get; set; }
        public double MaxDraftM { get; set; }
        public List<string> AllowedVesselTypeNames { get; set; } = new();
        public List<VesselTypeId> VesselsTypesObjs { get; set; } = new List<VesselTypeId>();
        public DockStatus Status { get; set; } = DockStatus.Available;

        public RegisterDockDto() { }

        public RegisterDockDto(
            string code,
            IEnumerable<string> physicalResourceCodes,
            string location,
            double lengthM,
            double depthM,
            double maxDraftM,
            IEnumerable<string> allowedVesselTypeNames,
            DockStatus status = DockStatus.Available)
        {
            Code = code;
            PhysicalResourceCodes = physicalResourceCodes?.ToList() ?? new List<string>();
            Location = location;
            LengthM = lengthM;
            DepthM = depthM;
            MaxDraftM = maxDraftM;
            AllowedVesselTypeNames = allowedVesselTypeNames?.ToList() ?? new List<string>();
            Status = status;
        }
    }
}