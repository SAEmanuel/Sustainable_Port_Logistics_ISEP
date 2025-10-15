using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Domain;

public class CargoManifestTests
{
    private readonly Email _submittedBy = new Email("submitter@example.com");

    private List<CargoManifestEntry> CreateDummyEntries()
    {
        var container = new EntityContainer(("MSCU6639870") , "Description", ContainerType.General, 1000);
        var storageAreaId = new StorageAreaId(Guid.NewGuid());
        return new List<CargoManifestEntry>
        {
            new (container, storageAreaId, 1, 1, 1),
            new(container, storageAreaId, 2, 2, 2)
        };
    }

    [Fact]
    public void CreateCargoManifest_ShouldInitializeProperties()
    {
        var entries = CreateDummyEntries();
        var cargoManifest = new CargoManifest(entries, "CARGO001", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);

        Assert.Equal("CARGO001", cargoManifest.Code);
        Assert.Equal(CargoManifestType.Loading, cargoManifest.Type);
        Assert.Equal(_submittedBy, cargoManifest.SubmittedBy);
        Assert.Equal(entries, cargoManifest.ContainerEntries);
        Assert.False(cargoManifest.CreatedAt == default);
    }

    [Fact]
    public void IsLoading_ShouldReturnTrue_WhenTypeIsLoading()
    {
        var manifest = new CargoManifest(CreateDummyEntries(), "CODE1", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);
        Assert.True(manifest.IsLoading());
        Assert.False(manifest.IsUnloading());
    }

    [Fact]
    public void IsUnloading_ShouldReturnTrue_WhenTypeIsUnloading()
    {
        var manifest = new CargoManifest(CreateDummyEntries(), "CODE2", CargoManifestType.Unloading, DateTime.UtcNow, _submittedBy);
        Assert.True(manifest.IsUnloading());
        Assert.False(manifest.IsLoading());
    }

    [Fact]
    public void Equals_SameCode_ShouldReturnTrue()
    {
        var manifest1 = new CargoManifest(CreateDummyEntries(), "CODEX", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);
        var manifest2 = new CargoManifest(CreateDummyEntries(), "codex", CargoManifestType.Unloading, DateTime.UtcNow, _submittedBy);

        Assert.True(manifest1.Equals(manifest2));
        Assert.Equal(manifest1.GetHashCode(), manifest2.GetHashCode());
    }

    [Fact]
    public void Equals_DifferentCode_ShouldReturnFalse()
    {
        var manifest1 = new CargoManifest(CreateDummyEntries(), "CODE1", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);
        var manifest2 = new CargoManifest(CreateDummyEntries(), "CODE2", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);

        Assert.False(manifest1.Equals(manifest2));
    }

    [Fact]
    public void Equals_NullObject_ShouldReturnFalse()
    {
        var manifest = new CargoManifest(CreateDummyEntries(), "CODE1", CargoManifestType.Loading, DateTime.UtcNow, _submittedBy);
        Assert.False(manifest.Equals(null));
    }
}