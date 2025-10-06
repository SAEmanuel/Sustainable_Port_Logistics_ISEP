namespace SEM5_PI_WEBAPI.Domain.Containers
{
    public class CreatingContainerDto
    {
        public string IsoCode { get; set; }
        public string Description { get; set; }
        public ContainerType Type { get; set; }
        public double WeightKg { get; set; }

        public CreatingContainerDto(string isoCode, string description, ContainerType type, double weightKg)
        {
            IsoCode = isoCode;
            Description = description;
            Type = type;
            WeightKg = weightKg;
        }
    }
}