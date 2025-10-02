namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class CreatingVesselTypeDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int MaxBays { get; set; }
        public int MaxRows { get; set; }
        public int MaxTiers { get; set; }
        public float Capacity { get; set; }

        public CreatingVesselTypeDto(string nameIn,string descriptionIn, int maxBaysIn,int maxRowsIn ,int maxTiersIn, float capacityIn)
        {
            Name = nameIn;
            Description = descriptionIn;
            MaxBays = maxBaysIn;
            MaxRows = maxRowsIn;
            MaxTiers = maxTiersIn;
            Capacity = capacityIn;
        }
    }
}

