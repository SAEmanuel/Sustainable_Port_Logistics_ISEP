using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class VesselServiceControllerTests
    {
        private readonly Mock<IVesselRepository> _vesselRepoMock = new();
        private readonly Mock<IVesselTypeRepository> _vesselTypeRepoMock = new();
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<ILogger<VesselService>> _serviceLogger = new();
        private readonly Mock<ILogger<VesselController>> _controllerLogger = new();

        private readonly VesselService _service;
        private readonly VesselController _controller;

        public VesselServiceControllerTests()
        {
            _service = new VesselService(_uowMock.Object, _vesselRepoMock.Object, _vesselTypeRepoMock.Object, _serviceLogger.Object);
            _controller = new VesselController(_service, _controllerLogger.Object);
        }


        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenVesselsExist()
        {
            var vessels = new List<Vessel>
            {
                new Vessel("IMO 1234567", "Poseidon", "OceanCorp", new VesselTypeId(Guid.NewGuid())),
                new Vessel("IMO 7654329", "Neptune", "BlueLine", new VesselTypeId(Guid.NewGuid()))
            };

            _vesselRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(vessels);

            var result = await _controller.GetAllAsync();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<List<VesselDto>>(ok.Value);
            Assert.Equal(2, data.Count);
            Assert.Contains(data, v => v.Name == "Poseidon");
        }


        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenVesselDoesNotExist()
        {
            var id = new VesselId(Guid.NewGuid());
            _vesselRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Vessel)null);

            var result = await _controller.GetById(id.AsGuid());

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("No Vessel Found", notFound.Value!.ToString());
        }


        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValidData()
        {
            var vesselTypeId = new VesselTypeId(Guid.NewGuid());
            var dto = new CreatingVesselDto("IMO 1111117", "Aurora", "GlobalMarine", vesselTypeId.Value.ToString());

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync((Vessel)null);

            _vesselTypeRepoMock.Setup(r => r.GetByIdAsync(dto.VesselTypeId))
                               .ReturnsAsync(new VesselType("Cargo", 5, 5, 5, "Cargo vessel type"));

            _vesselRepoMock.Setup(r => r.AddAsync(It.IsAny<Vessel>()))
                           .ReturnsAsync((Vessel v) => v);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _controller.CreateAsync(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<VesselDto>(created.Value);
            Assert.Equal(dto.ImoNumber, value.ImoNumber.ToString());
            Assert.Equal(dto.Name, value.Name);
            Assert.Equal(dto.Owner, value.Owner);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenImoAlreadyExists()
        {
            var vesselTypeId = new VesselTypeId(Guid.NewGuid());
            var dto = new CreatingVesselDto("IMO 1111117", "Atlantis", "SeaCorp", vesselTypeId.Value.ToString());

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync(new Vessel(dto.ImoNumber, dto.Name, dto.Owner, dto.VesselTypeId));

            var result = await _controller.CreateAsync(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("already exists", badRequest.Value!.ToString());
        }
        
        [Fact]
        public async Task GetByImo_ShouldReturnOk_WhenVesselExists()
        {
            var vessel = new Vessel("IMO 2222224", "Nautilus", "DeepBlue", new VesselTypeId(Guid.NewGuid()));
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync(vessel);

            var result = await _controller.GetByImoAsync("IMO 2222224");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal("Nautilus", dto.Name);
        }

        [Fact]
        public async Task GetByImo_ShouldReturnNotFound_WhenDoesNotExist()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync((Vessel)null);

            var result = await _controller.GetByImoAsync("IMO 1111117");

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("No Vessel Found", notFound.Value!.ToString());
        }


        [Fact]
        public async Task PatchByImo_ShouldReturnOk_WhenUpdatedSuccessfully()
        {
            var vessel = new Vessel("IMO 4444448", "Hercules", "OceanFleet", new VesselTypeId(Guid.NewGuid()));
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync(vessel);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new UpdatingVesselDto("Hercules II", "AquaCorp");

            var result = await _controller.PatchByImoAsync("IMO 4444448", dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var updated = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal("Hercules II", updated.Name);
            Assert.Equal("AquaCorp", updated.Owner);
        }

        [Fact]
        public async Task PatchByImo_ShouldReturnBadRequest_WhenVesselNotFound()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                           .ReturnsAsync((Vessel)null);

            var dto = new UpdatingVesselDto("Poseidon", "MaritimeX");

            var result = await _controller.PatchByImoAsync("IMO 5555555", dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("No Vessel found", badRequest.Value!.ToString());
        }
    }
}
