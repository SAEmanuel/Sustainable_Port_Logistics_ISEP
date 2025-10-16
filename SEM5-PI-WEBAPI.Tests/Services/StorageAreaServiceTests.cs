using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class StorageAreaServiceTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IStorageAreaRepository> _storageAreaRepoMock = new();
        private readonly Mock<IPhysicalResourceRepository> _physicalRepoMock = new();
        private readonly Mock<IDockRepository> _dockRepoMock = new();
        private readonly Mock<ILogger<StorageAreaService>> _loggerMock = new();

        private readonly StorageAreaService _service;

        public StorageAreaServiceTests()
        {
            _service = new StorageAreaService(
                _uowMock.Object,
                _loggerMock.Object,
                _storageAreaRepoMock.Object,
                _physicalRepoMock.Object,
                _dockRepoMock.Object
            );
        }

        // --------------------------------------------------------------------
        // ✅ CREATE TESTS
        // --------------------------------------------------------------------

        [Fact]
        public async Task CreateAsync_ShouldCreateStorageArea_WhenValid()
        {
            // Arrange
            var dockDto = new StorageAreaDockDistanceDto("DK-0001", 1.5f);
            var dto = new CreatingStorageAreaDto(
                "YardMain",
                "Primary storage area",
                StorageAreaType.Yard,
                10, 8, 5,
                new List<StorageAreaDockDistanceDto> { dockDto },
                new List<string> { "CRN-0001", "FORK-0002" }
            );

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync(dto.Name))
                .ReturnsAsync((StorageArea)null);

            _dockRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>()))
                .ReturnsAsync(new EntityDock(
                    new DockCode("DK-0001"),
                    new List<PhysicalResourceCode> { new("CRN-0001") },
                    "Main Dock Alpha",
                    200,
                    15,
                    12,
                    new List<VesselTypeId> { new(Guid.NewGuid()) },
                    DockStatus.Available
                ));

            _physicalRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<PhysicalResourceCode>()))
                .ReturnsAsync(new EntityPhysicalResource(
                    new PhysicalResourceCode("CRN-0001"),
                    "Crane A",
                    100,
                    10,
                    PhysicalResourceType.MCrane,
                    null
                ));

            _storageAreaRepoMock.Setup(r => r.AddAsync(It.IsAny<StorageArea>()))
                .ReturnsAsync((StorageArea s) => s);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(dto.Name, result.Name);
            _storageAreaRepoMock.Verify(r => r.AddAsync(It.IsAny<StorageArea>()), Times.Once);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenNameAlreadyExists()
        {
            var dto = new CreatingStorageAreaDto(
                "DuplicateYard",
                "Yard already exists",
                StorageAreaType.Yard,
                5, 5, 5,
                new List<StorageAreaDockDistanceDto>(),
                new List<string>()
            );

            var existing = new StorageArea(
                dto.Name, dto.Description, dto.Type,
                5, 5, 5,
                new List<StorageAreaDockDistance>(),
                new List<PhysicalResourceCode>()
            );

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync(dto.Name))
                .ReturnsAsync(existing);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("already exists", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenDockDoesNotExist()
        {
            var dto = new CreatingStorageAreaDto(
                "DockFail",
                "Invalid dock test",
                StorageAreaType.Yard,
                5, 5, 5,
                new List<StorageAreaDockDistanceDto> { new("DK-9999", 2.5f) }, // ✅ formato válido
                new List<string>()
            );

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync(dto.Name))
                .ReturnsAsync((StorageArea)null);

            _dockRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>()))
                .ReturnsAsync((EntityDock)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("does not exist", ex.Message);
        }


        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenPhysicalResourceDoesNotExist()
        {
            var dto = new CreatingStorageAreaDto(
                "YardX",
                "Missing PR",
                StorageAreaType.Yard,
                5, 5, 5,
                new List<StorageAreaDockDistanceDto> { new("DK-0001", 1.2f) },
                new List<string> { "INV-9999" }
            );

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync(dto.Name)).ReturnsAsync((StorageArea)null);
            _dockRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>()))
                .ReturnsAsync(new EntityDock(
                    new DockCode("DK-0001"),
                    new List<PhysicalResourceCode> { new("CRN-0001") },
                    "Dock A",
                    100,
                    12,
                    10,
                    new List<VesselTypeId> { new(Guid.NewGuid()) },
                    DockStatus.Available
                ));
            _physicalRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<PhysicalResourceCode>()))
                .ReturnsAsync((EntityPhysicalResource)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("Physical Resource", ex.Message);
        }

        // --------------------------------------------------------------------
        // ✅ GET TESTS
        // --------------------------------------------------------------------

        [Fact]
        public async Task GetAllAsync_ShouldReturnList_WhenExists()
        {
            var areas = new List<StorageArea>
            {
                new("YardA", "DescA", StorageAreaType.Yard, 5, 5, 5, new List<StorageAreaDockDistance>(), new List<PhysicalResourceCode>()),
                new("WarehouseB", "DescB", StorageAreaType.Warehouse, 10, 8, 6, new List<StorageAreaDockDistance>(), new List<PhysicalResourceCode>())
            };

            _storageAreaRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(areas);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Contains(result, r => r.Name == "WarehouseB");
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturn_WhenExists()
        {
            var id = new StorageAreaId(Guid.NewGuid());
            var sa = new StorageArea("Main", "Desc", StorageAreaType.Yard, 5, 5, 5, new List<StorageAreaDockDistance>(), new List<PhysicalResourceCode>());

            _storageAreaRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(sa);

            var result = await _service.GetByIdAsync(id);

            Assert.Equal(sa.Name, result.Name);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
        {
            var id = new StorageAreaId(Guid.NewGuid());
            _storageAreaRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((StorageArea)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByIdAsync(id));
            Assert.Contains("not found", ex.Message);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldReturn_WhenExists()
        {
            var sa = new StorageArea("Warehouse1", "Main", StorageAreaType.Warehouse, 5, 5, 5, new List<StorageAreaDockDistance>(), new List<PhysicalResourceCode>());
            _storageAreaRepoMock.Setup(r => r.GetByNameAsync("Warehouse1")).ReturnsAsync(sa);

            var result = await _service.GetByNameAsync("Warehouse1");

            Assert.Equal("Warehouse1", result.Name);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldThrow_WhenNotFound()
        {
            _storageAreaRepoMock.Setup(r => r.GetByNameAsync("Invalid")).ReturnsAsync((StorageArea)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByNameAsync("Invalid"));
            Assert.Contains("not found", ex.Message);
        }

        // --------------------------------------------------------------------
        // ✅ DISTANCES & PHYSICAL RESOURCES
        // --------------------------------------------------------------------

        [Fact]
        public async Task GetDistancesToDockAsync_ShouldReturnDistances_WhenValid()
        {
            var sa = new StorageArea("Yard1", "Desc", StorageAreaType.Yard, 5, 5, 5,
                new List<StorageAreaDockDistance> { new(new DockCode("DK-0001"), 2.5f) }, new List<PhysicalResourceCode>());

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync("Yard1")).ReturnsAsync(sa);

            var result = await _service.GetDistancesToDockAsync("Yard1", null);

            Assert.Single(result);
            Assert.Equal("DK-0001", result[0].DockCode);
        }

        [Fact]
        public async Task GetPhysicalResourcesAsync_ShouldReturnResources_WhenValid()
        {
            var sa = new StorageArea("YardRes", "Desc", StorageAreaType.Yard, 5, 5, 5,
                new List<StorageAreaDockDistance>(), new List<PhysicalResourceCode> { new("CRN-0001"), new("TRK-0002") });

            _storageAreaRepoMock.Setup(r => r.GetByNameAsync("YardRes")).ReturnsAsync(sa);

            var result = await _service.GetPhysicalResourcesAsync("YardRes", null);

            Assert.Equal(2, result.Count);
            Assert.Contains("CRN-0001", result);
        }

        [Fact]
        public async Task GetPhysicalResourcesAsync_ShouldThrow_WhenStorageAreaNotFound()
        {
            _storageAreaRepoMock.Setup(r => r.GetByNameAsync("Invalid")).ReturnsAsync((StorageArea)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetPhysicalResourcesAsync("Invalid", null));
            Assert.Contains("not found", ex.Message);
        }
    }
}
