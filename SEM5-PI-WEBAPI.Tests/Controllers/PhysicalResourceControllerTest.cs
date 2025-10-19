using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json.Linq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class PhysicalResourceControllerTests
    {
        private readonly Mock<IPhysicalResourceService> _serviceMock;
        private readonly PhysicalResourceController _controller;
        private readonly Mock<ILogger<PhysicalResourceController>> _loggerMock;

        public PhysicalResourceControllerTests()
        {
            _serviceMock = new Mock<IPhysicalResourceService>();
            _controller = new PhysicalResourceController(_serviceMock.Object,  _loggerMock.Object);
        }

        private PhysicalResourceDTO CreateDTO()
        {
            return new PhysicalResourceDTO(
                Guid.NewGuid(),
                new PhysicalResourceCode("TRUCK-0001"),
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                PhysicalResourceStatus.Available,
                Guid.NewGuid());
        }

        // --- GET ALL ---
        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenResourcesExist()
        {
            var list = new List<PhysicalResourceDTO> { CreateDTO() };
            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

            var result = await _controller.GetAll();

            Assert.NotNull(result.Value);
            Assert.Single(result.Value);
        }

        // --- GET BY ID ---
        [Fact]
        public async Task GetById_ShouldReturnOk_WhenFound()
        {
            var dto = CreateDTO();
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync(dto);

            var result = await _controller.GetByID(Guid.NewGuid());

            Assert.NotNull(result.Value);
            Assert.Equal(dto.Description, result.Value.Description);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync((PhysicalResourceDTO)null!);

            var result = await _controller.GetByID(Guid.NewGuid());

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal(404, notFound.StatusCode);
        }

        // --- POST CREATE ---
        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var dto = new CreatingPhysicalResourceDto(
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                "QUAL-001"
            );

            var created = CreateDTO();

            _serviceMock.Setup(s => s.AddAsync(It.IsAny<CreatingPhysicalResourceDto>()))
                .ReturnsAsync(created);

            var result = await _controller.Create(dto);

            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<PhysicalResourceDTO>(createdResult.Value);
            Assert.Equal("Truck A", value.Description);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleException()
        {
            var dto = new CreatingPhysicalResourceDto(
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                "QUAL-001"
            );

            _serviceMock.Setup(s => s.AddAsync(It.IsAny<CreatingPhysicalResourceDto>()))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid Qualification"));

            var result = await _controller.Create(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, badRequest.StatusCode);
        }

        // --- PATCH UPDATE ---
        [Fact]
        public async Task Update_ShouldReturnOk_WhenValidFields()
        {
            var updated = CreateDTO();
            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<PhysicalResourceId>(), It.IsAny<UpdatingPhysicalResource>()))
                .ReturnsAsync(updated);

            var body = new JObject { ["description"] = "Updated" };

            var result = await _controller.Update(Guid.NewGuid(), body);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<PhysicalResourceDTO>(ok.Value);
            Assert.Equal(updated.Id, dto.Id);
        }

        [Fact]
        public async Task Update_ShouldReturnBadRequest_WhenInvalidField()
        {
            var body = new JObject { ["invalidField"] = "x" };

            var result = await _controller.Update(Guid.NewGuid(), body);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("cannot be updated", badRequest.Value!.ToString());
        }

        [Fact]
        public async Task Update_ShouldReturnNotFound_WhenServiceReturnsNull()
        {
            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<PhysicalResourceId>(), It.IsAny<UpdatingPhysicalResource>()))
                .ReturnsAsync((PhysicalResourceDTO)null!);

            var body = new JObject { ["description"] = "Updated" };
            var result = await _controller.Update(Guid.NewGuid(), body);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task Update_ShouldReturnBadRequest_WhenServiceThrows()
        {
            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<PhysicalResourceId>(), It.IsAny<UpdatingPhysicalResource>()))
                .ThrowsAsync(new BusinessRuleValidationException("Error"));

            var body = new JObject { ["description"] = "Updated" };
            var result = await _controller.Update(Guid.NewGuid(), body);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, badRequest.StatusCode);
        }

        // --- DEACTIVATE ---
        [Fact]
        public async Task Deactivate_ShouldReturnOk_WhenSuccess()
        {
            var dto = CreateDTO();
            _serviceMock.Setup(s => s.DeactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync(dto);

            var result = await _controller.Deactivate(Guid.NewGuid());

            Assert.NotNull(result.Value);
            Assert.Equal(dto.Id, result.Value.Id);
        }

        [Fact]
        public async Task Deactivate_ShouldReturnNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.DeactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync((PhysicalResourceDTO)null!);

            var result = await _controller.Deactivate(Guid.NewGuid());

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal(404, notFound.StatusCode);
        }

        [Fact]
        public async Task Deactivate_ShouldReturnBadRequest_WhenThrowsException()
        {
            _serviceMock.Setup(s => s.DeactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ThrowsAsync(new Exception("Error"));

            var result = await _controller.Deactivate(Guid.NewGuid());

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, bad.StatusCode);
        }

        // --- REACTIVATE ---
        [Fact]
        public async Task Reactivate_ShouldReturnOk_WhenSuccess()
        {
            var dto = CreateDTO();
            _serviceMock.Setup(s => s.ReactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync(dto);

            var result = await _controller.Activate(Guid.NewGuid());

            Assert.NotNull(result.Value);
            Assert.Equal(dto.Id, result.Value.Id);
        }

        [Fact]
        public async Task Reactivate_ShouldReturnNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.ReactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync((PhysicalResourceDTO)null!);

            var result = await _controller.Activate(Guid.NewGuid());

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal(404, notFound.StatusCode);
        }

        [Fact]
        public async Task Reactivate_ShouldReturnBadRequest_WhenThrowsException()
        {
            _serviceMock.Setup(s => s.ReactivationAsync(It.IsAny<PhysicalResourceId>()))
                .ThrowsAsync(new Exception("Error"));

            var result = await _controller.Activate(Guid.NewGuid());

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, bad.StatusCode);
        }
    }
}
