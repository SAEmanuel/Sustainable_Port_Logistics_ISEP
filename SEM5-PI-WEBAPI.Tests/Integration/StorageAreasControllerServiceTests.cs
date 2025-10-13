using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class StorageAreasControllerServiceTests
    {
        private readonly Mock<IStorageAreaService> _serviceMock = new();
        private readonly Mock<ILogger<StorageAreasController>> _loggerMock = new();

        private readonly StorageAreasController _controller;

        public StorageAreasControllerServiceTests()
        {
            _controller = new StorageAreasController(_loggerMock.Object, _serviceMock.Object);
        }
        
        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenStorageAreasExist()
        {
            var dtoList = new List<StorageAreaDto>
            {
                new StorageAreaDto(Guid.NewGuid(), "AreaA", "Main storage",
                    StorageAreaType.Yard, 5, 5, 5, 1000, 800,
                    new List<StorageAreaDockDistanceDto>(), new List<string>()),
                new StorageAreaDto(Guid.NewGuid(), "AreaB", "Secondary storage",
                    StorageAreaType.Yard, 4, 4, 4, 500, 250,
                    new List<StorageAreaDockDistanceDto>(), new List<string>())
            };

            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(dtoList);

            var result = await _controller.GetAllAsync();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<List<StorageAreaDto>>(ok.Value);
            Assert.Equal(2, data.Count);
        }


        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenNotExists()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<StorageAreaId>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByIdAsync(Guid.NewGuid());

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("Not found", notFound.Value!.ToString());
        }

        [Fact]
        public async Task GetById_ShouldReturnOk_WhenExists()
        {
            var dto = new StorageAreaDto(Guid.NewGuid(), "DockA", "Dock Storage",
                StorageAreaType.Warehouse, 3, 3, 3, 300, 150,
                new List<StorageAreaDockDistanceDto>(), new List<string>());

            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<StorageAreaId>())).ReturnsAsync(dto);

            var result = await _controller.GetByIdAsync(dto.Id);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<StorageAreaDto>(ok.Value);
            Assert.Equal("DockA", value.Name);
        }


        [Fact]
        public async Task GetByName_ShouldReturnOk_WhenExists()
        {
            var dto = new StorageAreaDto(Guid.NewGuid(), "AreaA", "Description",
                StorageAreaType.Yard, 3, 3, 3, 500, 400,
                new List<StorageAreaDockDistanceDto>(), new List<string>());

            _serviceMock.Setup(s => s.GetByNameAsync("AreaA")).ReturnsAsync(dto);

            var result = await _controller.GetByNameAsync("AreaA");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<StorageAreaDto>(ok.Value);
            Assert.Equal("AreaA", value.Name);
        }

        [Fact]
        public async Task GetByName_ShouldReturnNotFound_WhenNotExists()
        {
            _serviceMock.Setup(s => s.GetByNameAsync(It.IsAny<string>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByNameAsync("Invalid");

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("Not found", notFound.Value!.ToString());
        }


        [Fact]
        public async Task GetDistances_ShouldReturnOk_WhenFound()
        {
            var distances = new List<StorageAreaDockDistanceDto>
            {
                new StorageAreaDockDistanceDto("Dock1", 1.2f),
                new StorageAreaDockDistanceDto("Dock2", 2.5f)
            };

            _serviceMock.Setup(s => s.GetDistancesToDockAsync("AreaA", null))
                        .ReturnsAsync(distances);

            var result = await _controller.GetDistancesToDockAsync("AreaA", null);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<StorageAreaDockDistanceDto>>(ok.Value);
            Assert.Equal(2, data.Count);
        }

        [Fact]
        public async Task GetDistances_ShouldReturnNotFound_WhenServiceThrows()
        {
            _serviceMock.Setup(s => s.GetDistancesToDockAsync(It.IsAny<string>(), It.IsAny<StorageAreaId>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Distances not found"));

            var result = await _controller.GetDistancesToDockAsync("Invalid", null);

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("Distances not found", notFound.Value!.ToString());
        }
        
        [Fact]
        public async Task GetPhysicalResources_ShouldReturnOk_WhenFound()
        {
            var resources = new List<string> { "Crane01", "Forklift02" };
            _serviceMock.Setup(s => s.GetPhysicalResourcesAsync("AreaA", null))
                        .ReturnsAsync(resources);

            var result = await _controller.GetPhysicalResources("AreaA", null);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<string>>(ok.Value);
            Assert.Equal(2, data.Count);
        }

        [Fact]
        public async Task GetPhysicalResources_ShouldReturnNotFound_WhenNotFound()
        {
            _serviceMock.Setup(s => s.GetPhysicalResourcesAsync(It.IsAny<string>(), It.IsAny<StorageAreaId>()))
                        .ThrowsAsync(new BusinessRuleValidationException("No resources found"));

            var result = await _controller.GetPhysicalResources("Invalid", null);

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("No resources found", notFound.Value!.ToString());
        }


        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValidData()
        {
            var dto = new CreatingStorageAreaDto(
                "AreaX",
                "New storage area",
                StorageAreaType.Yard,
                5, 5, 5,
                new List<StorageAreaDockDistanceDto>
                {
                    new StorageAreaDockDistanceDto("Dock1", 2.3f)
                },
                new List<string> { "Crane1", "Truck2" });

            var created = new StorageAreaDto(Guid.NewGuid(), dto.Name, dto.Description!,
                dto.Type, dto.MaxBays, dto.MaxRows, dto.MaxTiers,
                500, 0, dto.DistancesToDocks, dto.PhysicalResources);

            _serviceMock.Setup(s => s.CreateAsync(dto)).ReturnsAsync(created);

            var result = await _controller.CreateAsync(dto);

            var createdResult = Assert.IsType<CreatedAtRouteResult>(result.Result);
            var value = Assert.IsType<StorageAreaDto>(createdResult.Value);
            Assert.Equal(dto.Name, value.Name);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleFails()
        {
            var dto = new CreatingStorageAreaDto(
                "AreaY",
                "Invalid distances",
                StorageAreaType.Yard,
                4, 4, 4,
                new List<StorageAreaDockDistanceDto>
                {
                    new StorageAreaDockDistanceDto("Dock1", -1.0f)
                },
                new List<string> { "Crane1" });

            _serviceMock.Setup(s => s.CreateAsync(dto))
                        .ThrowsAsync(new BusinessRuleValidationException("All dock distances must be positive values and greater than zero."));

            var result = await _controller.CreateAsync(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("positive values", badRequest.Value!.ToString());
        }
    }
}
