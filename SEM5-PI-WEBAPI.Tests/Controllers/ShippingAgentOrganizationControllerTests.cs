using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class ShippingAgentOrganizationControllerTests
    {
        private readonly Mock<IShippingAgentOrganizationService> _mockService;
        private readonly Mock<ILogger<ShippingAgentOrganizationController>> _mockLogger;
        private readonly Mock<IResponsesToFrontend> _mockRefrontend;
        private readonly ShippingAgentOrganizationController _controller;

        public ShippingAgentOrganizationControllerTests()
        {
            _mockService = new Mock<IShippingAgentOrganizationService>();
            _mockLogger = new Mock<ILogger<ShippingAgentOrganizationController>>();
            _mockRefrontend = new Mock<IResponsesToFrontend>();

           _mockRefrontend
                .Setup(f => f.ProblemResponse(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns((string title, string detail, int status) =>
                {
                    return status switch
                    {
                        400 => new BadRequestObjectResult(detail),
                        404 => new NotFoundObjectResult(detail),
                        _   => new ObjectResult(detail) { StatusCode = status }
                    };
                });
                
            _controller = new ShippingAgentOrganizationController(_mockService.Object, _mockLogger.Object,_mockRefrontend.Object);
        }

        private readonly ShippingAgentOrganizationDto _sampleDto = new(
            Guid.NewGuid(),
            new ShippingOrganizationCode("AB1234567"),
            "Shipping Co.",
            "Shipping",
            "R. Dr. António Bernardino de Almeida 431, 4249-015 Porto",
            new TaxNumber("PT123456789")
        );

        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenOrganizationsExist()
        {
            var list = new List<ShippingAgentOrganizationDto> { _sampleDto };
            _mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

            var result = await _controller.GetAll();
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<IEnumerable<ShippingAgentOrganizationDto>>(okResult.Value);

            Assert.Single(data);
        }

        [Fact]
        public async Task GetGetById_ShouldReturnOk_WhenOrganizationExists()
        {
            var id = Guid.NewGuid();
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<ShippingAgentOrganizationId>()))
                        .ReturnsAsync(new ShippingAgentOrganizationDto(
                            id,
                            _sampleDto.ShippingOrganizationCode,
                            _sampleDto.LegalName,
                            _sampleDto.AltName,
                            _sampleDto.Address,
                            _sampleDto.Taxnumber
                        ));

            var result = await _controller.GetGetById(id);
            var okResult = Assert.IsType<ActionResult<ShippingAgentOrganizationDto>>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetGetById_ShouldReturnNotFound_WhenOrganizationDoesNotExist()
        {
            _mockService.Setup(s => s.GetByIdAsync(It.IsAny<ShippingAgentOrganizationId>()))
                        .ReturnsAsync((ShippingAgentOrganizationDto?)null);

            var result = await _controller.GetGetById(Guid.NewGuid());
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task GetByCodeAsync_ShouldReturnOk_WhenOrganizationExists()
        {
            _mockService.Setup(s => s.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.GetByCodeAsync(_sampleDto.ShippingOrganizationCode.ToString());
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentOrganizationDto>(okResult.Value);
            Assert.Equal(_sampleDto.ShippingOrganizationCode, dto.ShippingOrganizationCode);
        }

        [Fact]
        public async Task GetByCodeAsync_ShouldReturnNotFound_WhenOrganizationDoesNotExist()
        {
            _mockService.Setup(s => s.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetByCodeAsync("1234567890");
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var creatingDto = new CreatingShippingAgentOrganizationDto(
                _sampleDto.ShippingOrganizationCode.ToString(),
                _sampleDto.LegalName,
                _sampleDto.AltName,
                _sampleDto.Address,
                _sampleDto.Taxnumber.ToString()
            );

            _mockService.Setup(s => s.CreateAsync(It.IsAny<CreatingShippingAgentOrganizationDto>()))
                        .ReturnsAsync(_sampleDto);

            var result = await _controller.Create(creatingDto);
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentOrganizationDto>(createdResult.Value);
            Assert.Equal(_sampleDto.LegalName, dto.LegalName);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleException()
        {
            var creatingDto = new CreatingShippingAgentOrganizationDto(
                _sampleDto.ShippingOrganizationCode.ToString(),
                _sampleDto.LegalName,
                _sampleDto.AltName,
                _sampleDto.Address,
                _sampleDto.Taxnumber.ToString()
            );

            _mockService.Setup(s => s.CreateAsync(It.IsAny<CreatingShippingAgentOrganizationDto>()))
                        .ThrowsAsync(new BusinessRuleValidationException("Duplicate code"));

            var result = await _controller.Create(creatingDto);
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }
    }
}
