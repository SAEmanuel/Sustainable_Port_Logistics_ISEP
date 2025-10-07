using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests
{
    public class CargoManifest : Entity<CargoManifestId>, IAggregateRoot
    {
        public string Code { get; private set; }
        public CargoManifestType Type { get; private set; }
        public DateTime? CreatedAt { get; private set; }
        public string? SubmittedBy { get; private set; }

        private readonly List<CargoManifestEntry> _containerEntries;


        public CargoManifest(List<CargoManifestEntry> containerEntries, string code, CargoManifestType type,
            DateTime createdAt, string? submittedBy)
        {
            _containerEntries = containerEntries;
            Code = code;
            Type = type;
            CreatedAt = createdAt;
            SubmittedBy = submittedBy;
        }

        public bool IsLoading() => Type == CargoManifestType.Loading;
        public bool IsUnloading() => Type == CargoManifestType.Unloading;
    }
}