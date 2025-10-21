using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class ShippingAgentRepresentativeControllerTests
    {
        private readonly Mock<IShippingAgentRepresentativeService> _serviceMock = new();
        private readonly Mock<ILogger<ShippingAgentRepresentativeController>> _loggerMock = new();
        private readonly ShippingAgentRepresentativeController _controller;

        public ShippingAgentRepresentativeControllerTests()
        {
            _controller = new ShippingAgentRepresentativeController(_serviceMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenSARsExist()
        {
            var sarList = new List<ShippingAgentRepresentativeDto>
            {
                new ShippingAgentRepresentativeDto(
                    Guid.NewGuid(),
                    "John Doe",
                    new CitizenId("CIT123"),
                    Nationality.Portugal,
                    new EmailAddress("john@example.com"),
                    new PhoneNumber("+123456789"),
                    SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.activated,
                    new ShippingOrganizationCode("REP001XYZ"),
                    new List<VvnCode>()
                ),
                new ShippingAgentRepresentativeDto(
                    Guid.NewGuid(),
                    "Jane Smith",
                    new CitizenId("CIT456"),
                    Nationality.Spain,
                    new EmailAddress("jane@example.com"),
                    new PhoneNumber("+987654321"),
                    SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.deactivated,
                    new ShippingOrganizationCode("REP002ABC"),
                    new List<VvnCode>()
                )
            };

            _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(sarList);

            var result = await _controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsAssignableFrom<List<ShippingAgentRepresentativeDto>>(ok.Value);
            Assert.Equal(2, data.Count);
            Assert.Contains(data, x => x.Name == "John Doe");
        }

        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValidData()
        {
            var creatingDto = new CreatingShippingAgentRepresentativeDto(
                "John Doe",
                new CitizenId("CIT123"),
                Nationality.Portugal,
                new EmailAddress("john@example.com"),
                new PhoneNumber("+123456789"),
                "activated",
                "REP001XYZ"
            );

            var createdDto = new ShippingAgentRepresentativeDto(
                Guid.NewGuid(),
                creatingDto.Name,
                creatingDto.CitizenId,
                creatingDto.Nationality,
                creatingDto.Email,
                creatingDto.PhoneNumber,
                SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.activated,
                new ShippingOrganizationCode(creatingDto.Sao),
                new List<VvnCode>()
            );

            _serviceMock.Setup(s => s.AddAsync(creatingDto)).ReturnsAsync(createdDto);

            var result = await _controller.Create(creatingDto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var data = Assert.IsType<ShippingAgentRepresentativeDto>(created.Value);
            Assert.Equal("John Doe", data.Name);
        }

        [Fact]
        public async Task AddNotificationAsync_ShouldReturnOk_WhenValidData()
        {
            var vvn = new VvnCode("2025-THPA-000001");

            var updatedDto = new ShippingAgentRepresentativeDto(
                Guid.NewGuid(),
                "John Doe",
                new CitizenId("CIT123"),
                Nationality.Portugal,
                new EmailAddress("john@example.com"),
                new PhoneNumber("+123456789"),
                SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.activated,
                new ShippingOrganizationCode("REP001XYZ"),
                new List<VvnCode> { vvn }
            );

            _serviceMock.Setup(s => s.AddNotificationAsync("John Doe", "2025-THPA-000001")).ReturnsAsync(updatedDto);

            var result = await _controller.AddNotificationAsync("John Doe", "2025-THPA-000001");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<ShippingAgentRepresentativeDto>(ok.Value);
            Assert.Contains(data.Notifs, n => n.Code == "2025-THPA-000001");
        }
    }
}
