using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests
{
    public class CargoManifest : Entity<CargoManifestId>, IAggregateRoot
    {
        [MaxLength(8)]
        public string Code { get; private set; }
        public CargoManifestType Type { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public string SubmittedBy { get; private set; }

        private readonly List<CargoManifestEntry> _containerEntries;
        public IReadOnlyCollection<CargoManifestEntry> ContainerEntries => _containerEntries.AsReadOnly();
        
        protected CargoManifest()
        {
            _containerEntries = new List<CargoManifestEntry>();
        }


        public CargoManifest(List<CargoManifestEntry> containerEntries, string code, CargoManifestType type,
            DateTime createdAt, string submittedBy)
        {
            Id = new CargoManifestId(Guid.NewGuid());
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