namespace SEM5_PI_WEBAPI.Domain.Dock.DTOs
{
    public class UpdateDockDto
    {
        public string? Code { get; set; }
        public List<string>? PhysicalResourceCodes { get; set; }
        public string? Location { get; set; }
        public double? LengthM { get; set; }
        public double? DepthM { get; set; }
        public double? MaxDraftM { get; set; }
        public List<string>? AllowedVesselTypeIds { get; set; }

        public DockStatus? Status { get; set; }

        public UpdateDockDto() { }

        public UpdateDockDto(
            string? code,
            List<string>? physicalResourceCodes,
            string? location,
            double? lengthM,
            double? depthM,
            double? maxDraftM,
            List<string>? allowedVesselTypeIds,
            DockStatus? status = null)
        {
            Code = code;
            PhysicalResourceCodes = physicalResourceCodes;
            Location = location;
            LengthM = lengthM;
            DepthM = depthM;
            MaxDraftM = maxDraftM;
            AllowedVesselTypeIds = allowedVesselTypeIds;
            Status = status;
        }
    }
}