using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;

namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class StorageAreaTests
    {
        private readonly List<StorageAreaDockDistance> _defaultDistances = new()
        {
            new StorageAreaDockDistance(new DockCode("DK-1111"), 1.5f),
            new StorageAreaDockDistance(new DockCode("DK-2222"), 2.0f),
        };

        private readonly List<PhysicalResourceCode> _defaultResources = new()
        {
            new PhysicalResourceCode("YYC-0001"),
            new PhysicalResourceCode("DDC-0002")
        };

        // 1. CONSTRUCTION TESTS

        [Fact]
        public void CreateStorageArea_ValidData_ShouldInitializeCorrectly()
        {
            var stArea = new StorageArea("Yard A", "Main yard", StorageAreaType.Yard, 2, 2, 2, _defaultDistances, _defaultResources);

            Assert.Equal("Yard A", stArea.Name);
            Assert.Equal("Main yard", stArea.Description);
            Assert.Equal(StorageAreaType.Yard, stArea.Type);
            Assert.Equal(2, stArea.MaxBays);
            Assert.Equal(2, stArea.MaxRows);
            Assert.Equal(2, stArea.MaxTiers);
            Assert.Equal(8, stArea.MaxCapacityTeu);
            Assert.Equal(0, stArea.CurrentCapacityTeu);
            Assert.Equal(2, stArea.DistancesToDocks.Count);
            Assert.Equal(2, stArea.PhysicalResources.Count);
        }

        [Fact]
        public void CreateStorageArea_EmptyName_ShouldThrowException()
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new StorageArea("", "Desc", StorageAreaType.Warehouse, 1, 1, 1, _defaultDistances, _defaultResources));
        }

        [Fact]
        public void CreateStorageArea_NameTooShort_ShouldThrowException()
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new StorageArea("AB", "Desc", StorageAreaType.Warehouse, 1, 1, 1, _defaultDistances, _defaultResources));
        }

        [Fact]
        public void CreateStorageArea_NullDescription_ShouldUseDefault()
        {
            var stArea = new StorageArea("Yard B", null, StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            Assert.Equal("No description.", stArea.Description);
        }

        [Fact]
        public void CreateStorageArea_TooLongDescription_ShouldThrowException()
        {
            var longDesc = new string('X', 101);
            Assert.Throws<BusinessRuleValidationException>(() =>
                new StorageArea("Yard B", longDesc, StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources));
        }

        // 2. CONTAINER HANDLING TESTS

        [Fact]
        public void PlaceContainer_ValidSlot_ShouldIncreaseCapacity()
        {
            var stArea = new StorageArea("Yard C", "Desc", StorageAreaType.Yard, 2, 2, 2, _defaultDistances, _defaultResources);
            var iso = new Iso6346Code("MSCU6639870");

            stArea.PlaceContainer(iso, 0, 0, 0);

            Assert.Equal(1, stArea.CurrentCapacityTeu);
            Assert.Equal(iso, stArea.FindContainer(0, 0, 0));
        }

        [Fact]
        public void PlaceContainer_DuplicateSlot_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard D", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var iso1 = new Iso6346Code("MSCU6639870");
            var iso2 = new Iso6346Code("CSQU3054383");

            stArea.PlaceContainer(iso1, 0, 0, 0);

            Assert.Throws<BusinessRuleValidationException>(() =>
                stArea.PlaceContainer(iso2, 0, 0, 0));
        }

        [Fact]
        public void PlaceContainer_OutsideBounds_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard E", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var iso = new Iso6346Code("CSQU3054383");

            Assert.Throws<BusinessRuleValidationException>(() =>
                stArea.PlaceContainer(iso, 5, 5, 5));
        }

        [Fact]
        public void PlaceContainer_WhenFull_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard F", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var iso1 = new Iso6346Code("MSCU6639870");
            var iso2 = new Iso6346Code("CSQU3054383");

            stArea.PlaceContainer(iso1, 0, 0, 0);

            Assert.Throws<BusinessRuleValidationException>(() =>
                stArea.PlaceContainer(iso2, 0, 0, 0));
        }

        [Fact]
        public void RemoveContainer_ValidSlot_ShouldDecreaseCapacity()
        {
            var stArea = new StorageArea("Yard G", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var iso = new Iso6346Code("YZAB6639870");

            stArea.PlaceContainer(iso, 0, 0, 0);
            Assert.Equal(1, stArea.CurrentCapacityTeu);

            stArea.RemoveContainer(0, 0, 0);
            Assert.Equal(0, stArea.CurrentCapacityTeu);
        }

        [Fact]
        public void RemoveContainer_EmptySlot_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard H", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);

            Assert.Throws<BusinessRuleValidationException>(() =>
                stArea.RemoveContainer(0, 0, 0));
        }

        [Fact]
        public void FindContainer_WhenNotPresent_ShouldReturnNull()
        {
            var stArea = new StorageArea("Yard I", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var result = stArea.FindContainer(0, 0, 0);
            Assert.Null(result);
        }

        // 3. DOCK HANDLING TESTS

        [Fact]
        public void AssignDock_NewDock_ShouldAddDistance()
        {
            var stArea = new StorageArea("Yard J", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var newDock = new DockCode("DK-3333");

            stArea.AssignDock(newDock, 3.0f);

            Assert.Contains(stArea.DistancesToDocks, d => d.Dock.Value == "DK-3333" && d.Distance == 3.0f);
        }

        [Fact]
        public void AssignDock_DuplicateDock_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard K", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var dock = new DockCode("DK-1111");

            Assert.Throws<BusinessRuleValidationException>(() =>
                stArea.AssignDock(dock, 1.0f));
        }

        // 4. PHYSICAL RESOURCE TESTS

        [Fact]
        public void AddPhysicalResources_NewResources_ShouldIncreaseList()
        {
            var stArea = new StorageArea("Yard L", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, new List<PhysicalResourceCode>());
            var resources = new List<PhysicalResourceCode>
            {
                new PhysicalResourceCode("TTB-0001"),
                new PhysicalResourceCode("CCS-0002")
            };

            stArea.AddPhysicalResources(resources);

            Assert.Equal(2, stArea.PhysicalResources.Count);
            Assert.Contains(stArea.PhysicalResources, r => r.Value == "TTB-0001");
        }

        [Fact]
        public void RemovePhysicalResources_Existing_ShouldRemoveCorrectly()
        {
            var resource1 = new PhysicalResourceCode("MMC-0001");
            var resource2 = new PhysicalResourceCode("OOO-0002");

            var stArea = new StorageArea("Yard M", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, new List<PhysicalResourceCode> { resource1, resource2 });

            stArea.RemovePhysicalResources(new[] { resource1 });

            Assert.Single(stArea.PhysicalResources);
            Assert.DoesNotContain(stArea.PhysicalResources, r => r.Value == "MMC-0001");
        }

        [Fact]
        public void RemovePhysicalResources_NotExisting_ShouldDoNothing()
        {
            var stArea = new StorageArea("Yard N", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, new List<PhysicalResourceCode>());
            var nonExisting = new PhysicalResourceCode("TTT-9999");

            stArea.RemovePhysicalResources(new[] { nonExisting });

            Assert.Empty(stArea.PhysicalResources);
        }

        // 5. DESCRIPTION UPDATE TESTS

        [Fact]
        public void ChangeDescription_Valid_ShouldUpdate()
        {
            var stArea = new StorageArea("Yard P", "Old", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            stArea.ChangeDescription("New Desc");
            Assert.Equal("New Desc", stArea.Description);
        }

        [Fact]
        public void ChangeDescription_TooLong_ShouldThrowException()
        {
            var stArea = new StorageArea("Yard Q", "Desc", StorageAreaType.Yard, 1, 1, 1, _defaultDistances, _defaultResources);
            var longDesc = new string('X', 101);
            Assert.Throws<BusinessRuleValidationException>(() => stArea.ChangeDescription(longDesc));
        }
    }
}
