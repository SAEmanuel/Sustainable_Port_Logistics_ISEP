using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class VesselServiceTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IVesselRepository> _vesselRepoMock = new();
        private readonly Mock<IVesselTypeRepository> _vesselTypeRepoMock = new();
        private readonly Mock<ILogger<VesselService>> _loggerMock = new();

        private readonly VesselService _service;

        public VesselServiceTests()
        {
            _service = new VesselService(_uowMock.Object, _vesselRepoMock.Object, _vesselTypeRepoMock.Object, _loggerMock.Object);
        }
        

        [Fact]
        public async Task CreateAsync_ShouldCreateVessel_WhenValidData()
        {
            var dto = new CreatingVesselDto("IMO 1000007", "Ocean Star", "BlueSea", "Cargo");
            var vesselType = new VesselType("Cargo", 10, 8, 5, "General cargo vessel");

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel)null);

            _vesselTypeRepoMock.Setup(r => r.GetByNameAsync(dto.VesselTypeName))
                .ReturnsAsync(vesselType);

            _vesselRepoMock.Setup(r => r.AddAsync(It.IsAny<Vessel>()))
                .ReturnsAsync((Vessel v) => v);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);
            
            var result = await _service.CreateAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(dto.Name, result.Name);
            Assert.Equal(dto.Owner, result.Owner);
            _vesselRepoMock.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Once);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenImoAlreadyExists()
        {
            var dto = new CreatingVesselDto("IMO 1000007", "Sea King", "OceanFleet", "Cargo");
            var existingVessel = new Vessel(dto.ImoNumber, dto.Name, dto.Owner, new VesselTypeId(Guid.NewGuid()));

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(existingVessel);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("already exists", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenVesselTypeDoesNotExist()
        {
            var dto = new CreatingVesselDto("IMO 1000007", "Wave Rider", "BlueLine", "InvalidType");

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel)null);

            _vesselTypeRepoMock.Setup(r => r.GetByNameAsync(dto.VesselTypeName))
                .ReturnsAsync((VesselType)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("doesn't exists", ex.Message);
        }
        

        [Fact]
        public async Task GetByImoNumberAsync_ShouldReturnVessel_WhenExists()
        {
            var vessel = new Vessel("IMO 3333331", "Poseidon", "OceanCorp", new VesselTypeId(Guid.NewGuid()));

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(vessel);
            
            var result = await _service.GetByImoNumberAsync("IMO 3333331");

            Assert.NotNull(result);
            Assert.Equal("Poseidon", result.Name);
            _vesselRepoMock.Verify(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()), Times.Once);
        }

        [Fact]
        public async Task GetByImoNumberAsync_ShouldThrow_WhenNotFound()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByImoNumberAsync("IMO 3333331"));
            Assert.Contains("No Vessel Found", ex.Message);
        }
        

        [Fact]
        public async Task PatchByImoAsync_ShouldUpdateFields_WhenVesselExists()
        {
            var vessel = new Vessel("IMO 7777779", "Old Name", "OldOwner", new VesselTypeId(Guid.NewGuid()));
            var dto = new UpdatingVesselDto("New Name", "NewOwner");

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(vessel);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.PatchByImoAsync("IMO 7777779", dto);

            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            Assert.Equal("NewOwner", result.Owner);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task PatchByImoAsync_ShouldThrow_WhenVesselNotFound()
        {
            var dto = new UpdatingVesselDto("Update", "Owner");

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.PatchByImoAsync("IMO 3333331", dto));
            Assert.Contains("No Vessel found", ex.Message);
        }
        

        [Fact]
        public async Task GetAllAsync_ShouldReturnAll_WhenExist()
        {
            var vessels = new List<Vessel>
            {
                new Vessel("IMO 1111117", "AAAAAA", "O11111", new VesselTypeId(Guid.NewGuid())),
                new Vessel("IMO 2222224", "BBBBBB", "O22222", new VesselTypeId(Guid.NewGuid()))
            };

            _vesselRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(vessels);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
        }
    }
}
