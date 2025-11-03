using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Tests.utils;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class StorageAreasControllerTests
    {
        private readonly Mock<IStorageAreaService> _serviceMock;
        private readonly IResponsesToFrontend _frontend;
        private readonly StorageAreasController _controller;

        public StorageAreasControllerTests()
        {
            var loggerMock = new Mock<ILogger<StorageAreasController>>();
            _serviceMock = new Mock<IStorageAreaService>();
            _frontend = FrontendMockHelper.MockFrontend();

            _controller = new StorageAreasController(
                loggerMock.Object, 
                _serviceMock.Object, 
                _frontend);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsOk_WhenDataExists()
        {
            var list = new List<StorageAreaDto>
            {
                new StorageAreaDto(Guid.NewGuid(), "Yard A", "Main yard", StorageAreaType.Yard,
                2,2,2,8,0,new(), new() { "YC-01" })
            };

            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

            var result = await _controller.GetAllAsync();
            var ok = Assert.IsType<OkObjectResult>(result.Result);

            var data = Assert.IsAssignableFrom<List<StorageAreaDto>>(ok.Value);
            Assert.Single(data);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsProblem_WhenEmpty()
        {
            _serviceMock.Setup(s => s.GetAllAsync())
                .ThrowsAsync(new BusinessRuleValidationException("No storage areas"));

            var result = await _controller.GetAllAsync();
            var resp = Assert.IsType<ObjectResult>(result.Result);

            Assert.Equal(404, resp.StatusCode);
        }

        [Fact]
        public async Task GetById_ReturnsGrid_WhenExists()
        {
            var id = Guid.NewGuid();
            var grid = new StorageAreaGridDto(2,2,2, new List<StorageSlotDto>
            { new StorageSlotDto(0,0,0,"TEST1234567") });

            _serviceMock.Setup(s => s.GetGridAsync(new StorageAreaId(id)))
                .ReturnsAsync(grid);

            var result = await _controller.GetGrid(id);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.IsType<StorageAreaGridDto>(ok.Value);
        }

        [Fact]
        public async Task GetById_ReturnsProblem_WhenNotFound()
        {
            _serviceMock.Setup(s => s.GetGridAsync(It.IsAny<StorageAreaId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetGrid(Guid.NewGuid());
            var resp = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(404, resp.StatusCode);
        }

        [Fact]
        public async Task CreateAsync_ReturnsCreated_WhenValid()
        {
            var dto = new CreatingStorageAreaDto("A","d",StorageAreaType.Yard,1,1,1,new(),new());
            var created = new StorageAreaDto(Guid.NewGuid(),"A","d",StorageAreaType.Yard,1,1,1,1,0,new(),new());

            _serviceMock.Setup(s => s.CreateAsync(dto)).ReturnsAsync(created);

            var response = await _controller.CreateAsync(dto);
            var res = Assert.IsType<CreatedAtRouteResult>(response.Result);
            Assert.Equal("GetStorageAreaById", res.RouteName);
        }

        [Fact]
        public async Task CreateAsync_ReturnsProblem_WhenBusinessFails()
        {
            var dto = new CreatingStorageAreaDto("A","d",StorageAreaType.Yard,1,1,1,new(),new());

            _serviceMock.Setup(s => s.CreateAsync(dto))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid"));

            var response = await _controller.CreateAsync(dto);
            var problem = Assert.IsType<ObjectResult>(response.Result);

            Assert.Equal(400, problem.StatusCode);
        }
    }
}
