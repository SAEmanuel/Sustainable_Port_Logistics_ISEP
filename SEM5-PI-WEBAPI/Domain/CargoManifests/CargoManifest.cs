using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests
{
    public class CargoManifest : Entity<CargoManifestId>, IAggregateRoot
    {
        [MaxLength(8)] public string Code { get; private set; }
        public CargoManifestType Type { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public Email SubmittedBy { get; private set; }
        public List<CargoManifestEntry> ContainerEntries { get; set; }


        protected CargoManifest()
        {
        }


        public CargoManifest(List<CargoManifestEntry> containerEntries, string code, CargoManifestType type,
            DateTime createdAt, Email submittedBy)
        {
            Id = new CargoManifestId(Guid.NewGuid());
            ContainerEntries = containerEntries;
            Code = code;
            Type = type;
            CreatedAt = createdAt;
            SubmittedBy = submittedBy;
        }

        public bool IsLoading() => Type == CargoManifestType.Loading;
        public bool IsUnloading() => Type == CargoManifestType.Unloading;
        
        public override bool Equals(object? obj)
        {
            if (obj is CargoManifest other)
            {
                return string.Equals(Code, other.Code, StringComparison.OrdinalIgnoreCase);
            }
            return false;
        }

        public override int GetHashCode()
        {
            return Code != null ? StringComparer.OrdinalIgnoreCase.GetHashCode(Code) : 0;
        }
    }
}