using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class ShippingAgentOrganizationServiceControllerTests
    {
        private readonly Mock<IShippingAgentOrganizationService> _serviceMock = new();
        private readonly Mock<ILogger<ShippingAgentOrganizationController>> _controllerLogger = new();

        private readonly ShippingAgentOrganizationController _controller;

        public ShippingAgentOrganizationServiceControllerTests()
        {
            _controller = new ShippingAgentOrganizationController(_serviceMock.Object, _controllerLogger.Object);
        }

        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenShippingAgentOrganizationsExist()
        {
            var shippingAgentOrganizations = new List<ShippingAgentOrganizationDto>
            {
                new ShippingAgentOrganizationDto(
                    Guid.NewGuid(), 
                    new ShippingOrganizationCode("1234567890"), 
                    "LegalName1", 
                    "AltName1", 
                    "Address1", 
                    new TaxNumber("ATU12345678")
                ),
                new ShippingAgentOrganizationDto(
                    Guid.NewGuid(), 
                    new ShippingOrganizationCode("0987654321"), 
                    "LegalName2", 
                    "AltName2", 
                    "Address2", 
                    new TaxNumber("BE0123456789")
                )
            };

            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(shippingAgentOrganizations);

            var result = await _controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<List<ShippingAgentOrganizationDto>>(ok.Value);
            Assert.Equal(2, data.Count);
            Assert.Contains(data, x => x.LegalName == "LegalName1");
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenShippingAgentOrganizationDoesNotExist()
        {
            var id = new ShippingAgentOrganizationId(Guid.NewGuid());
            _serviceMock.Setup(s => s.GetByIdAsync(id)).ReturnsAsync((ShippingAgentOrganizationDto)null);

            var result = await _controller.GetGetById(id.AsGuid());

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task GetByCode_ShouldReturnOk_WhenShippingAgentOrganizationExists()
        {
            var shippingAgentOrganization = new ShippingAgentOrganizationDto(
                Guid.NewGuid(), 
                new ShippingOrganizationCode("1234567890"), 
                "LegalName", 
                "AltName", 
                "Address", 
                new TaxNumber("ATU12345678")
            );

            _serviceMock.Setup(s => s.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync(shippingAgentOrganization);

            var result = await _controller.GetByCodeAsync("1234567890");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentOrganizationDto>(ok.Value);
            Assert.Equal("LegalName", dto.LegalName);
        }

        [Fact]
        public async Task GetByCode_ShouldReturnNotFound_WhenShippingAgentOrganizationDoesNotExist()
        {
            _serviceMock.Setup(s => s.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                        .ThrowsAsync(new BusinessRuleValidationException("No Shipping Agent Organization Found"));

            var result = await _controller.GetByCodeAsync("1234567890");

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("No Shipping Agent Organization Found", notFound.Value!.ToString());
        }

        [Fact]
        public async Task GetByLegalName_ShouldReturnOk_WhenShippingAgentOrganizationExists()
        {
            var shippingAgentOrganization = new ShippingAgentOrganizationDto(
                Guid.NewGuid(), 
                new ShippingOrganizationCode("1234567890"), 
                "LegalName", 
                "AltName", 
                "Address", 
                new TaxNumber("ATU12345678")
            );

            _serviceMock.Setup(s => s.GetByLegalNameAsync("LegalName")).ReturnsAsync(shippingAgentOrganization);

            var result = await _controller.GetByLegalNameAsync("LegalName");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<ShippingAgentOrganizationDto>(ok.Value);
            Assert.Equal("LegalName", dto.LegalName);
        }

        [Fact]
        public async Task GetByLegalName_ShouldReturnNotFound_WhenShippingAgentOrganizationDoesNotExist()
        {
            _serviceMock.Setup(s => s.GetByLegalNameAsync("LegalName"))
                        .ThrowsAsync(new BusinessRuleValidationException("No Shipping Agent Organization Found"));

            var result = await _controller.GetByLegalNameAsync("LegalName");

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Contains("No Shipping Agent Organization Found", notFound.Value!.ToString());
        }

        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValidData()
        {
            var creatingDto = new CreatingShippingAgentOrganizationDto(
                "1234567890", 
                "LegalName", 
                "AltName", 
                "Address", 
                "ATU12345678"
            );

            var createdDto = new ShippingAgentOrganizationDto(
                Guid.NewGuid(), 
                new ShippingOrganizationCode(creatingDto.ShippingOrganizationCode), 
                creatingDto.LegalName, 
                creatingDto.AltName, 
                creatingDto.Address, 
                new TaxNumber(creatingDto.Taxnumber)
            );

            _serviceMock.Setup(s => s.CreateAsync(creatingDto)).ReturnsAsync(createdDto);

            var result = await _controller.Create(creatingDto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<ShippingAgentOrganizationDto>(created.Value);
            Assert.Equal(creatingDto.LegalName, value.LegalName);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleViolationOccurs()
        {
            var creatingDto = new CreatingShippingAgentOrganizationDto(
                "1234567890", 
                "LegalName", 
                "AltName", 
                "Address", 
                "ATU12345678"
            );

            _serviceMock.Setup(s => s.CreateAsync(creatingDto))
                        .ThrowsAsync(new BusinessRuleValidationException("Shipping Agent Organization already exists"));

            var result = await _controller.Create(creatingDto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Shipping Agent Organization already exists", badRequest.Value!.ToString());
        }
    }
}
