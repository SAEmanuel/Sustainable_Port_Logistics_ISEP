using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Tests.utils;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class StorageAreasControllerServiceTests
    {
        private readonly Mock<IStorageAreaService> _serviceMock = new();
        private readonly Mock<ILogger<StorageAreasController>> _loggerMock = new();
        private readonly IResponsesToFrontend _frontend;
        private readonly StorageAreasController _controller;

        public StorageAreasControllerServiceTests()
        {
            _frontend = FrontendMockHelper.MockFrontend();
            _controller = new StorageAreasController(_loggerMock.Object, _serviceMock.Object, _frontend);
        }

        [Fact]
        public async Task GetAll_ReturnsOk()
        {
            _serviceMock.Setup(x => x.GetAllAsync()).ReturnsAsync((List<StorageAreaDto>)new()
            {
                new StorageAreaDto(Guid.NewGuid(),"Area","D",StorageAreaType.Yard,1,1,1,1,0,new(),new())
            });

            var r = await _controller.GetAllAsync();
            Assert.IsType<OkObjectResult>(r.Result);
        }

        [Fact]
        public async Task GetByName_ReturnsProblem_IfNotFound()
        {
            _serviceMock.Setup(x => x.GetByNameAsync("X"))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var r = await _controller.GetByNameAsync("X");
            var resp = Assert.IsType<ObjectResult>(r.Result);
            Assert.Equal(404, resp.StatusCode);
        }

        [Fact]
        public async Task Create_ReturnsCreated()
        {
            var dto = new CreatingStorageAreaDto("A","B",StorageAreaType.Warehouse,1,1,1,new(),new());
            var returned = new StorageAreaDto(Guid.NewGuid(),"A","B",StorageAreaType.Warehouse,1,1,1,1,0,new(),new());

            _serviceMock.Setup(x => x.CreateAsync(dto)).ReturnsAsync(returned);

            var r = await _controller.CreateAsync(dto);
            Assert.IsType<CreatedAtRouteResult>(r.Result);
        }

        [Fact]
        public async Task GetGrid_ReturnsData()
        {
            var id = Guid.NewGuid();
            var grid = new StorageAreaGridDto(1,1,1,new());
            _serviceMock.Setup(x => x.GetGridAsync(new StorageAreaId(id))).ReturnsAsync(grid);

            var r = await _controller.GetGrid(id);
            var ok = Assert.IsType<OkObjectResult>(r.Result);
            Assert.IsType<StorageAreaGridDto>(ok.Value);
        }
    }
}
