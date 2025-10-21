using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class ShippingAgentRepresentativeControllerTests
    {
        private readonly Mock<IShippingAgentRepresentativeService> _mockService;
        private readonly Mock<ILogger<ShippingAgentRepresentativeController>> _mockLogger;
        private readonly ShippingAgentRepresentativeController _controller;

        public ShippingAgentRepresentativeControllerTests()
        {
            _mockService = new Mock<IShippingAgentRepresentativeService>();
            _mockLogger = new Mock<ILogger<ShippingAgentRepresentativeController>>();
            _controller = new ShippingAgentRepresentativeController(_mockService.Object, _mockLogger.Object);
        }

        private readonly ShippingAgentRepresentativeDto _sampleDto = new(
            Guid.NewGuid(),
            "John Doe",
            new CitizenId("AB123456"),
            Nationality.Portugal,
            new EmailAddress("john.doe@example.com"),
            new PhoneNumber("+351912345678"),
            Status.activated,
            new ShippingOrganizationCode("AB1234567"),
            new List<VvnCode>()
        );

        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenRepresentativesExist()
        {
            var list = new List<ShippingAgentRepresentativeDto> { _sampleDto };
            _mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

            var result = await _controller.GetAll();
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<IEnumerable<ShippingAgentRepresentativeDto>>(okResult.Value);

            Assert.Single(data);
        }

        [Fact]
        public async Task GetGetById_ShouldReturnOk_WhenRepresentativeExists()
        {
            var id = Guid.NewGuid();
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<ShippingAgentRepresentativeId>()))
                        .ReturnsAsync(new ShippingAgentRepresentativeDto(
                            id,
                            _sampleDto.Name,
                            _sampleDto.CitizenId,
                            _sampleDto.Nationality,
                            _sampleDto.Email,
                            _sampleDto.PhoneNumber,
                            _sampleDto.Status,
                            _sampleDto.SAO,
                            _sampleDto.Notifs
                        ));

            var result = await _controller.GetGetById(id);
            var okResult = Assert.IsType<ActionResult<ShippingAgentRepresentativeDto>>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetGetById_ShouldReturnNotFound_WhenRepresentativeDoesNotExist()
        {
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<ShippingAgentRepresentativeId>()))
                        .ReturnsAsync((ShippingAgentRepresentativeDto?)null);

            var result = await _controller.GetGetById(Guid.NewGuid());
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldReturnOk_WhenRepresentativeExists()
        {
            _mockService.Setup(s => s.GetByNameAsync(It.IsAny<string>()))
                        .ReturnsAsync(_sampleDto); 

            var result = await _controller.GetByNameAsync(_sampleDto.Name);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var data = new List<ShippingAgentRepresentativeDto> { Assert.IsType<ShippingAgentRepresentativeDto>(okResult.Value) };

            Assert.Single(data);
            Assert.Equal(_sampleDto.Name, data.First().Name);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldReturnNotFound_WhenRepresentativeDoesNotExist()
        {
            _mockService.Setup(s => s.GetByNameAsync(It.IsAny<string>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByNameAsync("Unknown");
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetByEmailAsync_ShouldReturnOk_WhenRepresentativeExists()
        {
            _mockService.Setup(s => s.GetByEmailAsync(It.IsAny<EmailAddress>()))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.GetByEmailAsync(_sampleDto.Email);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var data = new List<ShippingAgentRepresentativeDto> { Assert.IsType<ShippingAgentRepresentativeDto>(okResult.Value) };

            Assert.Single(data);
            Assert.Equal(_sampleDto.Email, data.First().Email);
        }

        [Fact]
        public async Task GetByStatusAsync_ShouldReturnOk_WhenRepresentativeExists()
        {
            _mockService.Setup(s => s.GetByStatusAsync(It.IsAny<Status>()))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.GetByStatusAsync(_sampleDto.Status);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var data = new List<ShippingAgentRepresentativeDto> { Assert.IsType<ShippingAgentRepresentativeDto>(okResult.Value) };

            Assert.Single(data);
            Assert.Equal(_sampleDto.Status, data.First().Status);
        }

        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var creatingDto = new CreatingShippingAgentRepresentativeDto(
                _sampleDto.Name,
                _sampleDto.CitizenId,
                _sampleDto.Nationality,
                _sampleDto.Email,
                _sampleDto.PhoneNumber,
                _sampleDto.Status.ToString(),
                _sampleDto.SAO.ToString()
            );

            _mockService.Setup(s => s.AddAsync(It.IsAny<CreatingShippingAgentRepresentativeDto>()))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.Create(creatingDto);
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentRepresentativeDto>(createdResult.Value);

            Assert.Equal(_sampleDto.Name, dto.Name);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleException()
        {
            var creatingDto = new CreatingShippingAgentRepresentativeDto(
                _sampleDto.Name,
                _sampleDto.CitizenId,
                _sampleDto.Nationality,
                _sampleDto.Email,
                _sampleDto.PhoneNumber,
                _sampleDto.Status.ToString(),
                _sampleDto.SAO.ToString()
            );

            _mockService.Setup(s => s.AddAsync(It.IsAny<CreatingShippingAgentRepresentativeDto>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Duplicate representative"));

            var result = await _controller.Create(creatingDto);
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdateAsync_ShouldReturnOk_WhenValid()
        {
            var updatingDto = new UpdatingShippingAgentRepresentativeDto
            {
                Email = new EmailAddress("new.email@example.com")
            };

            _mockService.Setup(s => s.PatchByNameAsync(_sampleDto.Name, updatingDto))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.UpdateAsync(_sampleDto.Name, updatingDto);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentRepresentativeDto>(okResult.Value);

            Assert.Equal(_sampleDto.Name, dto.Name);
        }

        [Fact]
        public async Task AddNotificationAsync_ShouldReturnOk_WhenValid()
        {
            var vvnCode = "2025-THPA-000001";
            _mockService.Setup(s => s.AddNotificationAsync(_sampleDto.Name, vvnCode))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.AddNotificationAsync(_sampleDto.Name, vvnCode);
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentRepresentativeDto>(okResult.Value);

            Assert.Equal(_sampleDto.Name, dto.Name);
        }

        [Fact]
        public async Task AddNotificationAsync_ShouldReturnBadRequest_WhenBusinessRuleException()
        {
            var vvnCode = "2025-THPA-000001";
            _mockService.Setup(s => s.AddNotificationAsync(_sampleDto.Name, vvnCode))
                        .ThrowsAsync(new BusinessRuleValidationException("Invalid VVN"));

            var result = await _controller.AddNotificationAsync(_sampleDto.Name, vvnCode);
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }
    }
}
