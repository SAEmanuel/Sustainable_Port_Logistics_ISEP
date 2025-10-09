using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Domain.StorageAreas;

public class StorageAreaTests
{
    private readonly List<StorageAreaDockDistance> _defaultDistances = new()
    {
        new StorageAreaDockDistance(new DockCode("DK-1111"), 1.5f),
        new StorageAreaDockDistance(new DockCode("DK-2222"), 2.0f),
    };

    [Fact]
    public void CreateStorageArea_ValidData_ShouldInitializeCorrectly()
    {
        var stArea = new StorageArea("Yard A", "Main yard", StorageAreaType.Yard, 2, 2, 2, _defaultDistances);

        Assert.Equal("Yard A", stArea.Name);
        Assert.Equal("Main yard", stArea.Description);
        Assert.Equal(StorageAreaType.Yard, stArea.Type);
        Assert.Equal(2, stArea.MaxBays);
        Assert.Equal(2, stArea.MaxRows);
        Assert.Equal(2, stArea.MaxTiers);
        Assert.Equal(8, stArea.MaxCapacityTeu);
        Assert.Equal(0, stArea.CurrentCapacityTeu);
        Assert.Equal(2, stArea.DistancesToDocks.Count);
    }

    [Fact]
    public void CreateStorageArea_EmptyName_ShouldThrowException()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StorageArea("", "Desc", StorageAreaType.Warehouse, 1, 1, 1, _defaultDistances));
    }

    [Fact]
    public void CreateStorageArea_NameTooShort_ShouldThrowException()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StorageArea("AB", "Desc", StorageAreaType.Warehouse, 1, 1, 1, _defaultDistances));
    }

    [Fact]
    public void CreateStorageArea_NullDescription_ShouldUseDefault()
    {
        var stArea = new StorageArea("Yard B", null, StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        Assert.Equal("No description.", stArea.Description);
    }

    [Fact]
    public void CreateStorageArea_TooLongDescription_ShouldThrowException()
    {
        var longDesc = new string('X', 101);
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StorageArea("Yard B", longDesc, StorageAreaType.Yard, 1, 1, 1, _defaultDistances));
    }

    [Fact]
    public void PlaceContainer_ValidSlot_ShouldIncreaseCapacity()
    {
        var stArea = new StorageArea("Yard C", "Desc", StorageAreaType.Yard, 2, 2, 2, _defaultDistances);
        var iso = new Iso6346Code("MSCU6639870");

        stArea.PlaceContainer(iso, 0, 0, 0);

        Assert.Equal(1, stArea.CurrentCapacityTeu);
        Assert.Equal(iso, stArea.FindContainer(0, 0, 0));
    }

    [Fact]
    public void PlaceContainer_DuplicateSlot_ShouldThrowException()
    {
        var stArea = new StorageArea("Yard D", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var iso1 = new Iso6346Code("MSCU6639870");
        var iso2 = new Iso6346Code("CSQU3054383");

        stArea.PlaceContainer(iso1, 0, 0, 0);

        Assert.Throws<BusinessRuleValidationException>(() =>
            stArea.PlaceContainer(iso2, 0, 0, 0));
    }

    [Fact]
    public void PlaceContainer_OutsideBounds_ShouldThrowException()
    {
        var stArea = new StorageArea("Yard E", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var iso = new Iso6346Code("CSQU3054383");

        Assert.Throws<BusinessRuleValidationException>(() =>
            stArea.PlaceContainer(iso, 5, 5, 5));
    }

    [Fact]
    public void PlaceContainer_WhenFull_ShouldThrowException()
    {
        var stArea = new StorageArea("Yard F", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var iso1 = new Iso6346Code("MSCU6639870");
        var iso2 = new Iso6346Code("CSQU3054383");

        stArea.PlaceContainer(iso1, 0, 0, 0);

        Assert.Throws<BusinessRuleValidationException>(() =>
            stArea.PlaceContainer(iso2, 0, 0, 0));
    }

    [Fact]
    public void RemoveContainer_ValidSlot_ShouldDecreaseCapacity()
    {
        var stArea = new StorageArea("Yard G", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var iso = new Iso6346Code("YZAB6639870");

        stArea.PlaceContainer(iso, 0, 0, 0);
        
        Assert.Equal(1, stArea.CurrentCapacityTeu);

        stArea.RemoveContainer(0, 0, 0);

        Assert.Equal(0, stArea.CurrentCapacityTeu);
    }

    [Fact]
    public void RemoveContainer_EmptySlot_ShouldThrowException()
    {
        var stArea = new StorageArea("Yard H", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);

        Assert.Throws<BusinessRuleValidationException>(() =>
            stArea.RemoveContainer(0, 0, 0));
    }

    [Fact]
    public void FindContainer_WhenNotPresent_ShouldReturnNull()
    {
        var stArea = new StorageArea("Yard I", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);

        var result = stArea.FindContainer(0, 0, 0);

        Assert.Null(result);
    }

    [Fact]
    public void AssignDock_NewDock_ShouldAddDistance()
    {
        var stArea = new StorageArea("Yard J", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var newDock = new DockCode("DK-3333");

        stArea.AssignDock(newDock, 3.0f);

        Assert.Contains(stArea.DistancesToDocks, d => d.Dock.Value == "DK-3333" && d.Distance == 3.0f);
    }

    [Fact]
    public void AssignDock_DuplicateDock_ShouldThrowException()
    {
        var stArea = new StorageArea("Yard K", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances);
        var dock = new DockCode("DK-1111");

        Assert.Throws<BusinessRuleValidationException>(() =>
            stArea.AssignDock(dock, 1.0f));
    }
}
