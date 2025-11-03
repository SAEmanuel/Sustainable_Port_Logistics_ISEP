using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class VesselServiceControllerTests
    {
        private readonly Mock<IVesselRepository> _vesselRepoMock = new();
        private readonly Mock<IVesselTypeRepository> _vesselTypeRepoMock = new();
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<ILogger<VesselService>> _serviceLogger = new();
        private readonly Mock<ILogger<VesselController>> _controllerLogger = new();
        private readonly Mock<IResponsesToFrontend> _frontendMock = new();

        private readonly VesselService _service;
        private readonly VesselController _controller;

        public VesselServiceControllerTests()
        {
            _frontendMock.Setup(x =>
                    x.ProblemResponse(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns((string title, string detail, int status) =>
                    new ObjectResult(new ProblemDetails
                    {
                        Title = title,
                        Detail = detail,
                        Status = status
                    })
                    {
                        StatusCode = status
                    });

            _service = new VesselService(_uowMock.Object, _vesselRepoMock.Object, _vesselTypeRepoMock.Object, _serviceLogger.Object);
            _controller = new VesselController(_service, _controllerLogger.Object, _frontendMock.Object);
        }

        private void AssertNotFound(ActionResult result, string expectedDetail)
        {
            var obj = Assert.IsType<ObjectResult>(result);
            Assert.Equal(404, obj.StatusCode);

            var problem = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Not Found", problem.Title);
            Assert.Equal(expectedDetail, problem.Detail);
        }

        private void AssertBadRequest(ActionResult result, string expectedDetail)
        {
            var obj = Assert.IsType<ObjectResult>(result);
            Assert.Equal(400, obj.StatusCode);

            var problem = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Validation Error", problem.Title);
            Assert.Equal(expectedDetail, problem.Detail);
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
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenVesselDoesNotExist()
        {
            var id = new VesselId(Guid.NewGuid());
            _vesselRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Vessel)null);

            var result = await _controller.GetById(id.AsGuid());

            AssertNotFound(result.Result, $"No Vessel Found with ID : {id.Value}");
        }

        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValidData()
        {
            var vesselType = new VesselType("Cargo", 5, 5, 5, "Cargo vessel");
            var dto = new CreatingVesselDto("IMO 1111117", "Aurora", "GlobalMarine", vesselType.Name);

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync((Vessel)null);
            _vesselTypeRepoMock.Setup(r => r.GetByNameAsync(dto.VesselTypeName)).ReturnsAsync(vesselType);
            _vesselRepoMock.Setup(r => r.AddAsync(It.IsAny<Vessel>())).ReturnsAsync((Vessel v) => v);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _controller.CreateAsync(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var vessel = Assert.IsType<VesselDto>(created.Value);
            Assert.Equal(dto.Name, vessel.Name);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenImoExists()
        {
            var vesselType = new VesselType("Cargo", 5, 5, 5, "type wwwwwwwwwwww");
            var dto = new CreatingVesselDto("IMO 1111117", "Atlantis", "SeaCorp", vesselType.Name);

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(new Vessel(dto.ImoNumber, dto.Name, dto.Owner, new VesselTypeId(Guid.NewGuid())));

            var result = await _controller.CreateAsync(dto);

            AssertBadRequest(result.Result, "Vessel with IMO Number 'IMO 1111117' already exists on DB.");
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenTypeMissing()
        {
            var dto = new CreatingVesselDto("IMO 1111117", "Odyssey", "SeaTrade", "BadType");

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync((Vessel)null);
            _vesselTypeRepoMock.Setup(r => r.GetByNameAsync(dto.VesselTypeName)).ReturnsAsync((VesselType)null);

            var result = await _controller.CreateAsync(dto);

            AssertBadRequest(result.Result, "Vessel Type with Name 'BadType' doesn't exists on DB.");
        }

        [Fact]
        public async Task GetByImo_ShouldReturnOk_WhenExists()
        {
            var vessel = new Vessel("IMO 2222224", "Nautilus", "DeepBlue", new VesselTypeId(Guid.NewGuid()));
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync(vessel);

            var result = await _controller.GetByImoAsync("IMO 2222224");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal("Nautilus", dto.Name);
        }

        [Fact]
        public async Task GetByImo_ShouldReturnNotFound_WhenMissing()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync((Vessel)null);

            var result = await _controller.GetByImoAsync("IMO 1111117");

            AssertNotFound(result.Result, "No Vessel Found with IMO Number : 1111117");
        }

        [Fact]
        public async Task PatchByImo_ShouldReturnOk_WhenUpdated()
        {
            var vessel = new Vessel("IMO 4444448", "Hercules", "OceanFleet", new VesselTypeId(Guid.NewGuid()));
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync(vessel);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new UpdatingVesselDto("Hercules II", "AquaCorp");

            var result = await _controller.PatchByImoAsync("IMO 4444448", dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var updated = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal("Hercules II", updated.Name);
        }

        [Fact]
        public async Task PatchByImo_ShouldReturnBadRequest_WhenNotFound()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel)null);

            var dto = new UpdatingVesselDto("Poseidon", "MaritimeX");

            var result = await _controller.PatchByImoAsync("IMO 5555555", dto);

            AssertBadRequest(result.Result, "No Vessel found with IMO IMO 5555555.");
        }
    }
}
