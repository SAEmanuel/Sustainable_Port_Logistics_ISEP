using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public enum StorageAreaType
{
    Yard,
    Warehouse
}

public class StorageArea : Entity<StorageAreaId>, IAggregateRoot
{
    private const string DefaultDescription = "No description.";
    private const int MinNameLength = 3;
    private const int MaxDescriptionLength = 100;

    public string Name { get; private set; }
    public string? Description { get; private set; }
    public StorageAreaType Type { get; private set; }

    public int MaxBays { get; private set; }
    public int MaxRows { get; private set; }
    public int MaxTiers { get; private set; }

    public int MaxCapacityTeu => MaxBays * MaxRows * MaxTiers;
    public int CurrentCapacityTeu { get; private set; }

    private readonly List<StorageAreaDockDistance> _distancesToDocks = new();
    public IReadOnlyCollection<StorageAreaDockDistance> DistancesToDocks => _distancesToDocks.AsReadOnly();

    private Iso6346Code?[,,] _grid; 

    protected StorageArea() { }

    public StorageArea(string name, string? description, StorageAreaType type,
        int maxBays, int maxRows, int maxTiers, IEnumerable<StorageAreaDockDistance> distancesToDocks)
    {
        SetName(name);
        SetDescription(description);

        Type = type;
        MaxBays = maxBays;
        MaxRows = maxRows;
        MaxTiers = maxTiers;

        _distancesToDocks.AddRange(distancesToDocks);
        CurrentCapacityTeu = 0;

        _grid = new Iso6346Code[MaxBays, MaxRows, MaxTiers];
        this.Id = new StorageAreaId(Guid.NewGuid());
    }
    

    public void PlaceContainer(Iso6346Code containerIso, int bay, int row, int tier)
    {
        if (_grid == null) throw new InvalidOperationException("Storage grid not initialized.");

        if (bay < 0 || bay >= MaxBays ||
            row < 0 || row >= MaxRows ||
            tier < 0 || tier >= MaxTiers)
            throw new BusinessRuleValidationException("Invalid Bay/Row/Tier position.");

        if (_grid[bay, row, tier] != null)
            throw new BusinessRuleValidationException("This slot is already occupied.");

        if (CurrentCapacityTeu >= MaxCapacityTeu)
            throw new BusinessRuleValidationException("The Storage Area is FULL.");

        _grid[bay, row, tier] = containerIso;
        CurrentCapacityTeu++;
    }

    public void RemoveContainer(int bay, int row, int tier)
    {
        if (_grid == null) throw new InvalidOperationException("Storage grid not initialized.");

        if (_grid[bay, row, tier] == null)
            throw new BusinessRuleValidationException("No container found in this slot.");

        _grid[bay, row, tier] = null;
        CurrentCapacityTeu--;
    }

    public Iso6346Code? FindContainer(int bay, int row, int tier)
    {
        if (_grid == null) throw new InvalidOperationException("Storage grid not initialized.");
        return _grid[bay, row, tier];
    }

    public void AssignDock(DockCode dock, float distance)
    {
        if (_distancesToDocks.Any(d => d.Dock.Value == dock.Value))
            throw new BusinessRuleValidationException($"Dock with DockCode {dock.Value} already exists.");

        _distancesToDocks.Add(new StorageAreaDockDistance(dock, distance));
    }
    

    private void SetDescription(string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            Description = DefaultDescription;
            return;
        }

        if (description.Length > MaxDescriptionLength)
            throw new BusinessRuleValidationException(
                $"Description can't be longer than [{MaxDescriptionLength}] characters.");

        Description = description;
    }

    private void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length < MinNameLength)
            throw new BusinessRuleValidationException($"Name must have at least {MinNameLength} characters.");
        Name = name;
    }

    public override string ToString() =>
        $"StorageArea [Name={Name}, Type={Type}, Capacity={CurrentCapacityTeu}/{MaxCapacityTeu} TEUs]";
}