using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class VesselTypeControllerTests
    {
        private readonly Mock<IVesselTypeService> _serviceMock;
        private readonly Mock<ILogger<VesselTypeController>> _loggerMock;
        private readonly Mock<IResponsesToFrontend> _frontendMock;
        private readonly VesselTypeController _controller;

        public VesselTypeControllerTests()
        {
            _serviceMock = new Mock<IVesselTypeService>();
            _loggerMock = new Mock<ILogger<VesselTypeController>>();
            _frontendMock = new Mock<IResponsesToFrontend>();

            // mock padrão do ProblemResponse
            _frontendMock.Setup(x => x.ProblemResponse(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns((string title, string detail, int status) =>
                    new ObjectResult(new ProblemDetails { Title = title, Detail = detail, Status = status })
                    {
                        StatusCode = status
                    });

            _controller = new VesselTypeController(_serviceMock.Object, _loggerMock.Object, _frontendMock.Object);
        }

        private static VesselTypeDto BuildDto(string name = "Container Carrier") =>
            new VesselTypeDto(Guid.NewGuid(), name, "Description", 10, 8, 6, 480);


        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenFound()
        {
            var list = new List<VesselTypeDto> { BuildDto(), BuildDto("Bulk Carrier") };
            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

            var result = await _controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<List<VesselTypeDto>>(ok.Value);
            Assert.Equal(2, value.Count);
        }

        [Fact]
        public async Task GetAll_ShouldReturnProblemResponse_WhenBusinessRuleFails()
        {
            _serviceMock.Setup(s => s.GetAllAsync()).ThrowsAsync(new BusinessRuleValidationException("No vessels"));

            var result = await _controller.GetAll();

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(404, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Not Found", details.Title);
            Assert.Equal("No vessels", details.Detail);
        }


        [Fact]
        public async Task GetById_ShouldReturnOk_WhenFound()
        {
            var dto = BuildDto();
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselTypeId>())).ReturnsAsync(dto);

            var result = await _controller.GetById(Guid.NewGuid());

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(dto.Name, ((VesselTypeDto)ok.Value!).Name);
        }

        [Fact]
        public async Task GetById_ShouldReturnProblemResponse_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselTypeId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Missing"));

            var result = await _controller.GetById(Guid.NewGuid());

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(404, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Not Found", details.Title);
            Assert.Equal("Missing", details.Detail);
        }



        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var dto = new CreatingVesselTypeDto("Test", "desc", 10, 8, 6);
            var created = BuildDto("Test");
            _serviceMock.Setup(s => s.AddAsync(dto)).ReturnsAsync(created);

            var result = await _controller.Create(dto);

            var createdRes = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal(created.Name, ((VesselTypeDto)createdRes.Value).Name);
        }

        [Fact]
        public async Task Create_ShouldReturnProblemResponse_WhenInvalid()
        {
            var dto = new CreatingVesselTypeDto("Bad", "desc", 1, 1, 1);
            _serviceMock.Setup(s => s.AddAsync(dto)).ThrowsAsync(new BusinessRuleValidationException("Invalid"));

            var result = await _controller.Create(dto);

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(400, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Validation Error", details.Title);
            Assert.Equal("Invalid", details.Detail);
        }



        [Fact]
        public async Task GetByName_ShouldReturnOk_WhenFound()
        {
            var dto = BuildDto("Cargo");
            _serviceMock.Setup(s => s.GetByNameAsync("Cargo")).ReturnsAsync(dto);

            var result = await _controller.GetByName("Cargo");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal("Cargo", ((VesselTypeDto)ok.Value).Name);
        }

        [Fact]
        public async Task GetByName_ShouldReturnProblemResponse_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByNameAsync("Missing"))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByName("Missing");

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(404, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Not Found", details.Title);
            Assert.Equal("Not found", details.Detail);
        }



        [Fact]
        public async Task GetByDescription_ShouldReturnOk_WhenFound()
        {
            var list = new List<VesselTypeDto> { BuildDto("A"), BuildDto("B") };
            _serviceMock.Setup(s => s.GetByDescriptionAsync("desc")).ReturnsAsync(list);

            var result = await _controller.GetByDescription("desc");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(2, ((List<VesselTypeDto>)ok.Value).Count);
        }

        [Fact]
        public async Task GetByDescription_ShouldReturnProblemResponse_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByDescriptionAsync("desc"))
                .ThrowsAsync(new BusinessRuleValidationException("None"));

            var result = await _controller.GetByDescription("desc");

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(404, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Not Found", details.Title);
            Assert.Equal("None", details.Detail);
        }

        
        [Fact]
        public async Task Filter_ShouldReturnOk_WhenFound()
        {
            var list = new List<VesselTypeDto> { BuildDto("A"), BuildDto("B") };
            _serviceMock.Setup(s => s.FilterAsync("A", null, null)).ReturnsAsync(list);

            var result = await _controller.Filter("A", null, null);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(2, ((List<VesselTypeDto>)ok.Value).Count);
        }

        [Fact]
        public async Task Filter_ShouldReturnProblemResponse_WhenNoResults()
        {
            _serviceMock.Setup(s => s.FilterAsync(null, null, null))
                .ThrowsAsync(new BusinessRuleValidationException("Empty"));

            var result = await _controller.Filter(null, null, null);

            var obj = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(400, obj.StatusCode);

            var details = Assert.IsType<ProblemDetails>(obj.Value);
            Assert.Equal("Validation Error", details.Title);
            Assert.Equal("Empty", details.Detail);
        }
        
        [Fact]
        public async Task Update_ShouldReturnOk_WhenValid()
        {
            var id = Guid.NewGuid();
            var dto = new UpdateVesselTypeDto
            {
                Name = "Updated Vessel",
                Description = "Updated desc",
                MaxBays = 15
            };

            var updated = new VesselTypeDto(id, "Updated Vessel", dto.Description!, 15, 8, 6, 720);
            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<VesselTypeId>(), dto)).ReturnsAsync(updated);

            var result = await _controller.Update(id, dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var value = Assert.IsType<VesselTypeDto>(ok.Value);
            Assert.Equal("Updated Vessel", value.Name);
        }

    }
}
