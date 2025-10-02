using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselType : Entity<VesselTypeId>, IAggregateRoot
    {
        public const string DEFAULT_DESCRIPTION = "No description";
        public string Name { get; private set; }
        public string? Description { get; private set; }
        public int MaxBays { get; private set; }
        public int MaxRows { get; private set; }
        public int MaxTiers { get; private set; }
        public float Capacity { get; private set; }    // In TEU Units

        
        //========== Constructors 
        protected VesselType() { }
        
        public VesselType(string nameIn, int maxBaysIn, int maxRowsIn, int maxTiersIn, string? descriptionIn = DEFAULT_DESCRIPTION)
        {
            this.Id = new VesselTypeId(Guid.NewGuid());
            this.Name = nameIn;
            this.Description = descriptionIn;
            this.MaxBays = maxBaysIn;
            this.MaxRows = maxRowsIn;
            this.MaxTiers = maxTiersIn;
            this.Capacity = calculateMaxCapacity();
        }


        //========== Updates 
        private bool UpdateName(string updatedName)
        {
            if (string.IsNullOrWhiteSpace(updatedName))
                throw new BusinessRuleValidationException("Name cannot be empty.");
            
            this.Name = updatedName;
            return true;
        }

        private bool UpdateDescription(string? updatedDescription)
        {
            if (updatedDescription == null)
                throw new BusinessRuleValidationException("Description cannot be null.");
            
            this.Description = updatedDescription;
            return true;
        }

        private bool UpdateMaxBays(int updatedMaxBays)
        {
            if (updatedMaxBays <= 0) {
                throw new BusinessRuleValidationException("Max 'Bays' cannot be negative or 0.");
            }
            this.MaxBays = updatedMaxBays;
            return true;
        }

        private bool UpdateMaxRows(int updatedMaxRows)
        {
            if (updatedMaxRows <= 0) {
                throw new BusinessRuleValidationException("Max 'Rows' cannot be negative or 0.");
            }
            this.MaxRows = updatedMaxRows;
            return true;
        }

        private bool UpdateMaxTiers(int updatedMaxTiers)
        {
            if (updatedMaxTiers <= 0) {
                throw new BusinessRuleValidationException("Max 'Tiers' cannot be negative or 0.");
            }
            this.MaxTiers = updatedMaxTiers;
            return true;
        }

        private bool UpdateCapacity(float updatedCapacity)
        {
            float maxCapacity = calculateMaxCapacity();
            
            if (updatedCapacity <= 0 || maxCapacity > updatedCapacity) {
                throw new BusinessRuleValidationException($"Max 'Capacity' cannot be negative,zero or bigger than the Max 'Capacity' {maxCapacity}.");
            }
            
            this.Capacity = updatedCapacity;
            return true;
        }

        public override bool Equals(object? obj) => obj is VesselType otherVesselType && this.Id == otherVesselType.Id;
        
        public override int GetHashCode() => Id.GetHashCode();
        
        public override string ToString() =>
            $"VesselType [Name: {Name}, Description: {Description}, Bays: {MaxBays}, Rows: {MaxRows}, Tiers: {MaxTiers}, Capacity: {Capacity} TEU]";
        
        // ============= Extras
        private float calculateMaxCapacity() {
            return this.MaxBays * this.MaxRows * this.MaxTiers ;
        }
    }
}

