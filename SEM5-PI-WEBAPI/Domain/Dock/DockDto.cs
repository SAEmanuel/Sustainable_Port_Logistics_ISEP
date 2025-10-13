using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock
{
    public class DockDto
    {
        public Guid Id { get; set; }
        public DockCode Code { get; private set; }
        public IReadOnlyCollection<PhysicalResourceCode> PhysicalResourceCodes { get; private set; }
        public string Location { get; private set; }
        public double LengthM { get; private set; }
        public double DepthM { get; private set; }
        public double MaxDraftM { get; private set; }
        public DockStatus Status { get; private set; }
        public IReadOnlyCollection<VesselTypeId> AllowedVesselTypeIds { get; private set; }

        public DockDto(
            Guid id, DockCode code,
            IEnumerable<PhysicalResourceCode> physicalResourceCodes,
            string location, double lengthM, double depthM, double maxDraftM,
            DockStatus status,
            IEnumerable<VesselTypeId> allowedVesselTypeIds)
        {
            Id = id;
            Code = code;
            PhysicalResourceCodes = physicalResourceCodes.ToList().AsReadOnly();
            Location = location;
            LengthM = lengthM;
            DepthM = depthM;
            MaxDraftM = maxDraftM;
            Status = status;
            AllowedVesselTypeIds = allowedVesselTypeIds.ToList().AsReadOnly();
        }
    }
}