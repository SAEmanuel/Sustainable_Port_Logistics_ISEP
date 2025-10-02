namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselTypeDto
    {
        public Guid Id { get; set; }
        private string Name { get; set; }
        private string Description { get; set; }
        private int MaxBays { get; set; }
        private int MaxRows { get; set; }
        private int MaxTiers { get; set; }
        private float Capacity { get; set; }    // In TEU Units

        
        //========== Constructors 
        
        public VesselTypeDto(Guid IdIn,string nameIn, string descriptionIn, int maxBaysIn,int maxRowsIn ,int maxTiersIn, float capacityIn)
        {
            this.Id = IdIn;
            this.Name = nameIn;
            this.Description = descriptionIn;
            this.MaxBays = maxBaysIn;
            this.MaxRows = maxRowsIn;
            this.MaxTiers = maxTiersIn;
            this.Capacity = capacityIn;
        }
    }
}