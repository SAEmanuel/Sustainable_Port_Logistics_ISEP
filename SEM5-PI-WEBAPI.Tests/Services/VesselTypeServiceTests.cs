using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class VesselTypeServiceTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IVesselTypeRepository> _repoMock = new();
        private readonly Mock<ILogger<VesselTypeService>> _loggerMock = new();

        private readonly VesselTypeService _service;

        public VesselTypeServiceTests()
        {
            _service = new VesselTypeService(_uowMock.Object, _repoMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task AddAsync_ShouldCreateVesselType_WhenValid()
        {
            var dto = new CreatingVesselTypeDto("Panamax", "Medium-sized vessel", 20, 15, 10);

            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<VesselType>());
            _repoMock.Setup(r => r.AddAsync(It.IsAny<VesselType>()))
                     .ReturnsAsync((VesselType v) => v);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.AddAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(dto.Name, result.Name);
            _repoMock.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Once);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task AddAsync_ShouldThrow_WhenVesselTypeAlreadyExists()
        {
            
            var dto = new CreatingVesselTypeDto("Panamax", "Duplicate test", 10, 10, 10);
            var existing = new VesselType("Panamax", 20, 15, 10, "Existing vessel type");

            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<VesselType> { existing });

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddAsync(dto));
            Assert.Contains("already exists", ex.Message);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturn_WhenExists()
        {
            var id = new VesselTypeId(Guid.NewGuid());
            var type = new VesselType("Handymax", 15, 10, 8, "Smaller type");

            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(type);

            var result = await _service.GetByIdAsync(id);

            Assert.Equal("Handymax", result.Name);
            _repoMock.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
        {
            var id = new VesselTypeId(Guid.NewGuid());
            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((VesselType)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByIdAsync(id));
            Assert.Contains("No Vessel Type Found", ex.Message);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldReturn_WhenExists()
        {
            var type = new VesselType("Feedermax", 10, 8, 6, "Small ship");

            _repoMock.Setup(r => r.GetByNameAsync("Feedermax")).ReturnsAsync(type);

            var result = await _service.GetByNameAsync("Feedermax");

            Assert.Equal("Feedermax", result.Name);
            _repoMock.Verify(r => r.GetByNameAsync("Feedermax"), Times.Once);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldThrow_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByNameAsync("InvalidType")).ReturnsAsync((VesselType)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByNameAsync("InvalidType"));
            Assert.Contains("No Vessel Type Found", ex.Message);
        }

        [Fact]
        public async Task GetByDescriptionAsync_ShouldReturnList_WhenExists()
        {
            var types = new List<VesselType>
            {
                new VesselType("Type1", 10, 10, 10, "Bulk cargo"),
                new VesselType("Type2", 12, 11, 9, "Bulk cargo")
            };

            _repoMock.Setup(r => r.GetByDescriptionAsync("Bulk cargo")).ReturnsAsync(types);

            var result = await _service.GetByDescriptionAsync("Bulk cargo");

            Assert.Equal(2, result.Count);
            _repoMock.Verify(r => r.GetByDescriptionAsync("Bulk cargo"), Times.Once);
        }

        [Fact]
        public async Task GetByDescriptionAsync_ShouldThrow_WhenEmpty()
        {
            _repoMock.Setup(r => r.GetByDescriptionAsync("Empty")).ReturnsAsync(new List<VesselType>());

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByDescriptionAsync("Empty"));
            Assert.Contains("No Vessel/s Type/s Found", ex.Message);
        }
        

        [Fact]
        public async Task FilterAsync_ShouldReturnList_WhenMatchesFound()
        {
            var list = new List<VesselType>
            {
                new VesselType("Panamax", 20, 15, 10, "Medium vessel."),
                new VesselType("Post-Panamax", 24, 18, 12, "Large vessel.")
            };

            _repoMock.Setup(r => r.FilterAsync("Panamax", null, null)).ReturnsAsync(list);

            var result = await _service.FilterAsync("Panamax", null, null);

            Assert.Equal(2, result.Count);
            _repoMock.Verify(r => r.FilterAsync("Panamax", null, null), Times.Once);
        }

        [Fact]
        public async Task FilterAsync_ShouldThrow_WhenEmpty()
        {
            _repoMock.Setup(r => r.FilterAsync(null, null, null)).ReturnsAsync(new List<VesselType>());

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.FilterAsync(null, null, null));
            Assert.Contains("No Vessel/s Type/s Found", ex.Message);
        }
        

        [Fact]
        public async Task UpdateAsync_ShouldUpdateFields_WhenValid()
        {
            var id = new VesselTypeId(Guid.NewGuid());
            var entity = new VesselType("OldName", 10, 10, 10, "Old description");

            var dto = new UpdateVesselTypeDto
            {
                Name = "NewName",
                Description = "New description",
                MaxBays = 12,
                MaxRows = 14,
                MaxTiers = 11
            };

            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(entity);
            _repoMock.Setup(r => r.GetByNameAsync("NewName")).ReturnsAsync((VesselType)null);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.UpdateAsync(id, dto);

            Assert.Equal("NewName", result.Name);
            Assert.Equal("New description", result.Description);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_ShouldThrow_WhenNotFound()
        {
            var id = new VesselTypeId(Guid.NewGuid());
            var dto = new UpdateVesselTypeDto { Name = "Update" };

            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((VesselType)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.UpdateAsync(id, dto));
            Assert.Contains("No Vessel Type found", ex.Message);
        }

        [Fact]
        public async Task UpdateAsync_ShouldThrow_WhenNameAlreadyExists()
        {
            var id = new VesselTypeId(Guid.NewGuid());
            var entity = new VesselType("Original", 10, 10, 10, "Description for vessel type");
            var dto = new UpdateVesselTypeDto { Name = "Duplicate" };

            var existing = new VesselType("Duplicate", 15, 15, 15, "Other Description for vessel type");

            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(entity);
            _repoMock.Setup(r => r.GetByNameAsync("Duplicate")).ReturnsAsync(existing);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.UpdateAsync(id, dto));
            Assert.Contains("already exists", ex.Message);
        }
    }
}
