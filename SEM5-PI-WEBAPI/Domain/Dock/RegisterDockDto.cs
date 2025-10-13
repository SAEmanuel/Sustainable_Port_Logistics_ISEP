namespace SEM5_PI_WEBAPI.Domain.Dock
{
    public class RegisterDockDto
    {
        public string Code { get; set; } = null!;
        public List<string> PhysicalResourceCodes { get; set; } = new();
        public string Location { get; set; } = null!;
        public double LengthM  { get; set; }
        public double DepthM   { get; set; }
        public double MaxDraftM { get; set; }
        public List<string> AllowedVesselTypeIds { get; set; } = new();

        public DockStatus Status { get; set; } = DockStatus.Available;

        public RegisterDockDto() { }

        public RegisterDockDto(
            string code,
            IEnumerable<string> physicalResourceCodes,
            string location,
            double lengthM,
            double depthM,
            double maxDraftM,
            IEnumerable<string> allowedVesselTypeIds,
            DockStatus status = DockStatus.Available)
        {
            Code = code;
            PhysicalResourceCodes = physicalResourceCodes?.ToList() ?? new List<string>();
            Location = location;
            LengthM = lengthM;
            DepthM = depthM;
            MaxDraftM = maxDraftM;
            AllowedVesselTypeIds = allowedVesselTypeIds?.ToList() ?? new List<string>();
            Status = status;
        }
    }
}