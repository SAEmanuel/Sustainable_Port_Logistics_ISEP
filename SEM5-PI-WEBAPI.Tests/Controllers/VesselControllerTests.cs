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

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class VesselControllerTests
    {
        private readonly Mock<IVesselService> _mockService;
        private readonly Mock<ILogger<VesselController>> _mockLogger;
        private readonly Mock<IResponsesToFrontend> _mockResponsesToFrontend;
        private readonly VesselController _controller;

        public VesselControllerTests()
        {
            _mockService = new Mock<IVesselService>();
            _mockLogger = new Mock<ILogger<VesselController>>();
            _mockResponsesToFrontend= new Mock<IResponsesToFrontend>();
            
            _mockResponsesToFrontend.Setup(x => x.ProblemResponse(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns((string title, string detail, int status) =>
                    new ObjectResult(new ProblemDetails { Title = title, Detail = detail, Status = status })
                    {
                        StatusCode = status
                    });
            
            _controller = new VesselController(_mockService.Object, _mockLogger.Object,_mockResponsesToFrontend.Object);
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
        public async Task GetAllAsync_ShouldReturnOk_WhenVesselsExist()
        {
            var vessels = new List<VesselDto>
            {
                new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9074729"), "Poseidon", "Atlantic", new VesselTypeId(Guid.NewGuid()))
            };

            _mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(vessels);

            var result = await _controller.GetAllAsync();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<VesselDto>>(ok.Value);
            Assert.Single(data);
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnNotFound_WhenNoVessels()
        {
            _mockService.Setup(s => s.GetAllAsync())
                .ThrowsAsync(new BusinessRuleValidationException("No vessels found"));

            var result = await _controller.GetAllAsync();

            AssertNotFound(result.Result, "No vessels found");
        }

        [Fact]
        public async Task GetById_ShouldReturnOk_WhenFound()
        {
            var dto = new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9074729"), "Neptune", "Oceanic", new VesselTypeId(Guid.NewGuid()));
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<VesselId>())).ReturnsAsync(dto);

            var result = await _controller.GetById(dto.Id);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal(dto.Id, value.Id);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenMissing()
        {
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<VesselId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetById(Guid.NewGuid());

            AssertNotFound(result.Result, "Not found");
        }

        [Fact]
        public async Task CreateAsync_ShouldReturnCreated_WhenValid()
        {
            var dto = new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9074729"), "Apollo", "Seaway", new VesselTypeId(Guid.NewGuid()));
            _mockService.Setup(s => s.CreateAsync(It.IsAny<CreatingVesselDto>())).ReturnsAsync(dto);

            var result = await _controller.CreateAsync(
                new CreatingVesselDto("IMO 9074729", "Apollo", "Seaway", Guid.NewGuid().ToString())
            );

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<VesselDto>(created.Value);
            Assert.Equal(dto.Id, value.Id);
        }

        [Fact]
        public async Task CreateAsync_ShouldReturnBadRequest_WhenBusinessError()
        {
            _mockService.Setup(s => s.CreateAsync(It.IsAny<CreatingVesselDto>()))
                .ThrowsAsync(new BusinessRuleValidationException("Duplicate IMO"));

            var result = await _controller.CreateAsync(
                new CreatingVesselDto("IMO 9074729", "Apollo", "Seaway", Guid.NewGuid().ToString())
            );

            AssertBadRequest(result.Result, "Duplicate IMO");
        }

        [Fact]
        public async Task GetByImoAsync_ShouldReturnOk_WhenFound()
        {
            var dto = new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9074729"), "Titan", "Maritime", new VesselTypeId(Guid.NewGuid()));
            _mockService.Setup(s => s.GetByImoNumberAsync("IMO 9074729")).ReturnsAsync(dto);

            var result = await _controller.GetByImoAsync("IMO 9074729");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.IsType<VesselDto>(ok.Value);
        }

        [Fact]
        public async Task GetByImoAsync_ShouldReturnNotFound_WhenMissing()
        {
            _mockService.Setup(s => s.GetByImoNumberAsync(It.IsAny<string>()))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByImoAsync("IMO 9999999");

            AssertNotFound(result.Result, "Not found");
        }
        
        [Fact]
        public async Task GetByNameAsync_ShouldReturnOk_WhenFound()
        {
            var list = new List<VesselDto>
            {
                new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9074729"), "OceanStar", "BlueSea", new VesselTypeId(Guid.NewGuid()))
            };
            _mockService.Setup(s => s.GetByNameAsync("OceanStar")).ReturnsAsync(list);

            var result = await _controller.GetByNameAsync("OceanStar");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<VesselDto>>(ok.Value);
            Assert.Single(data);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldReturnNotFound_WhenMissing()
        {
            _mockService.Setup(s => s.GetByNameAsync(It.IsAny<string>()))
                .ThrowsAsync(new BusinessRuleValidationException("No vessels"));

            var result = await _controller.GetByNameAsync("Unknown");

            AssertNotFound(result.Result, "No vessels");
        }

        [Fact]
        public async Task GetByOwnerAsync_ShouldReturnOk_WhenFound()
        {
            var list = new List<VesselDto>
            {
                new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 9000003"), "Horizon", "OwnerA", new VesselTypeId(Guid.NewGuid()))
            };
            _mockService.Setup(s => s.GetByOwnerAsync("OwnerA")).ReturnsAsync(list);

            var result = await _controller.GetByOwnerAsync("OwnerA");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<VesselDto>>(ok.Value);
            Assert.Single(data);
        }

        [Fact]
        public async Task GetByOwnerAsync_ShouldReturnNotFound_WhenMissing()
        {
            _mockService.Setup(s => s.GetByOwnerAsync(It.IsAny<string>()))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByOwnerAsync("Missing");

            AssertNotFound(result.Result, "Not found");
        }

        [Fact]
        public async Task GetByFilterAsync_ShouldReturnOk_WhenResultsExist()
        {
            var list = new List<VesselDto>
            {
                new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 8888886"), "Mariner", "OceanCo", new VesselTypeId(Guid.NewGuid()))
            };
            _mockService.Setup(s => s.GetFilterAsync("Mariner", null, null, null)).ReturnsAsync(list);

            var result = await _controller.GetByFilterAsync("Mariner", null, null, null);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<VesselDto>>(ok.Value);
            Assert.Single(data);
        }

        [Fact]
        public async Task GetByFilterAsync_ShouldReturnNotFound_WhenNoResults()
        {
            _mockService.Setup(s => s.GetFilterAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                .ThrowsAsync(new BusinessRuleValidationException("No vessels"));

            var result = await _controller.GetByFilterAsync(null, null, null, null);

            AssertNotFound(result.Result, "No vessels");
        }
        
        [Fact]
        public async Task PatchByImoAsync_ShouldReturnOk_WhenUpdated()
        {
            var dto = new VesselDto(Guid.NewGuid(), new ImoNumber("IMO 7777779"), "Hercules", "OceanCorp", new VesselTypeId(Guid.NewGuid()));
            _mockService.Setup(s => s.PatchByImoAsync("IMO 7777779", It.IsAny<UpdatingVesselDto>()))
                .ReturnsAsync(dto);

            var result = await _controller.PatchByImoAsync("IMO 7777779", new UpdatingVesselDto("NewName", "NewOwner"));

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<VesselDto>(ok.Value);
            Assert.Equal(dto.ImoNumber.Value, value.ImoNumber.Value);
        }

        [Fact]
        public async Task PatchByImoAsync_ShouldReturnBadRequest_WhenNullDto()
        {
            var result = await _controller.PatchByImoAsync("IMO7777777", null);
            
            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("No changes provided.", bad.Value);
        }

        [Fact]
        public async Task PatchByImoAsync_ShouldReturnBadRequest_WhenError()
        {
            _mockService.Setup(s => s.PatchByImoAsync(It.IsAny<string>(), It.IsAny<UpdatingVesselDto>()))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid update"));

            var result = await _controller.PatchByImoAsync("IMO7777777", new UpdatingVesselDto("Name", "Owner"));

            AssertBadRequest(result.Result, "Invalid update");
        }
    }
}
