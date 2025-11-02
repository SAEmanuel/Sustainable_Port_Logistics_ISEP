using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VesselsTypes
{
    public class VesselType : Entity<VesselTypeId>, IAggregateRoot
    {
        private const string DefaultDescription = "No description";
        private const int MaxDescriptionLength = 200;
        private const int MinDescriptionLength = 10;
        private const int MaxNameLength = 50;
        private const int MinBays = 1;
        private const int MinRows = 1;
        private const int MinTiers = 1;
        
        public string Name { get; private set; }
        public string Description { get; private set; } = DefaultDescription;
        public int MaxBays { get; private set; }
        public int MaxRows { get; private set; }
        public int MaxTiers { get; private set; }
        public float Capacity { get; private set; }

        
        
        //========== Constructors 
        protected VesselType() { }

        public VesselType(string nameIn, int maxBaysIn, int maxRowsIn, int maxTiersIn, string? descriptionIn = DefaultDescription)
        {
            SetName(nameIn);
            SetDescription(descriptionIn ?? DefaultDescription);
            SetDimensions(maxBaysIn, maxRowsIn, maxTiersIn);

            this.Id = new VesselTypeId(Guid.NewGuid());
        }

        
        
        
        
        
        
        //========== Update methods (public domain behaviors)
        public void ChangeName(string updatedName) => SetName(updatedName);

        public void ChangeDescription(string? updatedDescription) => SetDescription(updatedDescription ?? DefaultDescription);
        
        public void ChangeDimensions(int updatedMaxBays, int updatedMaxRows, int updatedMaxTiers) { SetDimensions(updatedMaxBays, updatedMaxRows, updatedMaxTiers); }

        public void ChangeMaxBays(int updatedMaxBays)
        {
            MaxBays = updatedMaxBays;
            Capacity = CalculateMaxCapacity();
        }

        public void ChangeMaxRows(int updatedMaxRows)
        {
            SetMaxRows(updatedMaxRows);
            Capacity = CalculateMaxCapacity();
        }

        public void ChangeMaxTiers(int updatedMaxTiers)
        {
            SetMaxTiers(updatedMaxTiers);
            Capacity = CalculateMaxCapacity();
        }

        
        
        
        //========== Private Setters with validation
        private void SetName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) throw new BusinessRuleValidationException("Name can't be empty.");
            if (name.Length > MaxNameLength) throw new  BusinessRuleValidationException($"Name exceeds maximum length for a Vessel Type Name [MAX {MaxNameLength} characters].");
            //if (!Regex.IsMatch(name, @"^[a-zA-Z0-9\s]+$")) throw new BusinessRuleValidationException("Name can only contain letters, numbers and spaces.");

            
            this.Name = name.Trim();
        }

        private void SetDescription(string description)
        {
            
            if (description.Length > MaxDescriptionLength) throw new BusinessRuleValidationException($"Description exceeds maximum length for a Vessel Type Description [MAX {MaxDescriptionLength} characters].");
            if (description.Length < MinDescriptionLength) throw new BusinessRuleValidationException($"Description requires a minimum length for a Vessel Type Description of [MIN {MinDescriptionLength} characters].");
            
           this.Description = description.Trim();
        }

        private void SetDimensions(int bays, int rows, int tiers)
        {
            SetMaxBays(bays);
            SetMaxRows(rows);
            SetMaxTiers(tiers);

            Capacity = CalculateMaxCapacity();
        }

        private void SetMaxBays(int maxBays)
        {
            if (maxBays < MinBays) throw new BusinessRuleValidationException($"Max 'Bays' must be greater than {MinBays}.");
            this.MaxBays = maxBays;
        }
        
        private void SetMaxRows(int maxRows)
        {
            if (maxRows < MinRows) throw new BusinessRuleValidationException($"Max 'Rows' must be greater than {MinRows}.");
            this.MaxRows = maxRows;
        }

        private void SetMaxTiers(int maxTiers)
        {
            if(maxTiers < MinTiers) throw new BusinessRuleValidationException($"Max 'Tiers' must be greater than {MinTiers}.");
            this.MaxTiers = maxTiers;
        }

        //========== Equality overrides
        public override bool Equals(object? obj) =>
            obj is VesselType otherVesselType && this.Id.Equals(otherVesselType.Id);

        public override int GetHashCode() => Id.GetHashCode();

        public override string ToString() =>
            $"VesselType [Name: {Name}, Description: {Description}, Bays: {MaxBays}, Rows: {MaxRows}, Tiers: {MaxTiers}, Capacity: {Capacity} TEU]";

        //========== Helpers
        private float CalculateMaxCapacity() => MaxBays * MaxRows * MaxTiers;
    }
}
