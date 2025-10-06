using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Containers
{
    public class ContainerDto
    {
        public Guid Id { get; set; }
        public Iso6346Code IsoCode { get; set; }
        public string Description { get; set; }
        public ContainerType Type { get; set; }
        public ContainerStatus Status { get; set; }
        public double WeightKg { get; set; }
        
        public ContainerDto(Guid id, Iso6346Code isoCode, string description, ContainerType type, ContainerStatus status, double weightKg)
        {
            Id = id;
            IsoCode = isoCode;
            Description = description;
            Type = type;
            Status = status;
            WeightKg = weightKg;

        }
        
    }
}