using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.Tasks;

namespace SEM5_PI_WEBAPI.Tests.Controllers
{
    public class VesselVisitNotificationControllerTests
    {
        private readonly Mock<IVesselVisitNotificationService> _serviceMock;
        private readonly Mock<ILogger<VesselVisitNotificationController>> _loggerMock;
        private readonly VesselVisitNotificationController _controller;

        public VesselVisitNotificationControllerTests()
        {
            _serviceMock = new Mock<IVesselVisitNotificationService>();
            _loggerMock = new Mock<ILogger<VesselVisitNotificationController>>();
            _controller = new VesselVisitNotificationController(_serviceMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task CreateAsync_ShouldReturnCreated_WhenValid()
        {
            var createDto = new CreatingVesselVisitNotificationDto(
                DateTime.Now.AddDays(1).ToString("O"),
                DateTime.Now.AddDays(2).ToString("O"),
                1200,
                "doc1.pdf",
                null,
                null,
                null,
                "IMO1234567",
                "agent@example.com"
            );

            var createdDto = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.InProgress.ToString(), 1200);

            _serviceMock.Setup(s => s.AddAsync(It.IsAny<CreatingVesselVisitNotificationDto>()))
                .ReturnsAsync(createdDto);

            var result = await _controller.CreateAsync(createDto);

            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<VesselVisitNotificationDto>(createdResult.Value);
            Assert.Equal("2025-THPA-000001", value.Code);
            Assert.Equal(1200, value.Volume);
        }

        [Fact]
        public async Task CreateAsync_ShouldReturnBadRequest_WhenInvalid()
        {
            var dto = new CreatingVesselVisitNotificationDto(
                DateTime.Now.ToString("O"),
                DateTime.Now.AddDays(-1).ToString("O"),
                800,
                null,
                null,
                null,
                null,
                "IMO1234567",
                "agent@example.com"
            );

            _serviceMock.Setup(s => s.AddAsync(dto))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid ETA/ETD"));

            var result = await _controller.CreateAsync(dto);
            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid ETA/ETD", bad.Value);
        }

        [Fact]
        public async Task GetById_ShouldReturnOk_WhenExists()
        {
            var dto = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.InProgress.ToString());
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(dto);

            var result = await _controller.GetById(Guid.Parse(dto.Id));

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.IsType<VesselVisitNotificationDto>(ok.Value);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenNotExists()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Not found"));

            var result = await _controller.GetById(Guid.NewGuid());
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task WithdrawById_ShouldReturnOk_WhenSuccess()
        {
            var dto = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.Withdrawn.ToString());
            _serviceMock.Setup(s => s.WithdrawByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(dto);

            var result = await _controller.WithdrawByIdAsync(Guid.Parse(dto.Id));
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task WithdrawById_ShouldReturnBadRequest_WhenRuleFails()
        {
            _serviceMock.Setup(s => s.WithdrawByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Cannot withdraw"));

            var result = await _controller.WithdrawByIdAsync(Guid.NewGuid());
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task WithdrawByCode_ShouldReturnOk_WhenSuccess()
        {
            var dto = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.Withdrawn.ToString());
            _serviceMock.Setup(s => s.WithdrawByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync(dto);

            var result = await _controller.WithdrawByCodeAsync("2025-THPA-000001");
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task WithdrawByCode_ShouldReturnBadRequest_WhenInvalid()
        {
            _serviceMock.Setup(s => s.WithdrawByCodeAsync(It.IsAny<VvnCode>()))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid code"));

            var result = await _controller.WithdrawByCodeAsync("invalid");
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task SubmitByCode_ShouldReturnOk_WhenSuccess()
        {
            var dto = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.Submitted.ToString());
            _serviceMock.Setup(s => s.SubmitByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync(dto);

            var result = await _controller.SubmitByCodeAsync("2025-THPA-000001");
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task SubmitById_ShouldReturnBadRequest_WhenInvalid()
        {
            _serviceMock.Setup(s => s.SubmitByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid state"));

            var result = await _controller.SubmitByIdAsync(Guid.NewGuid());
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdateAsync_ShouldReturnOk_WhenValid()
        {
            var id = Guid.NewGuid();
            var dto = BuildDto(id.ToString(), "2025-THPA-000001", VvnStatus.InProgress.ToString(), 2000);
            var updateDto = new UpdateVesselVisitNotificationDto { Volume = 2000 };

            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<VesselVisitNotificationId>(), updateDto))
                .ReturnsAsync(dto);

            var result = await _controller.UpdateAsync(id, updateDto);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdateAsync_ShouldReturnBadRequest_WhenRuleFails()
        {
            var dto = new UpdateVesselVisitNotificationDto();
            _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<VesselVisitNotificationId>(), dto))
                .ThrowsAsync(new BusinessRuleValidationException("Cannot update"));

            var result = await _controller.UpdateAsync(Guid.NewGuid(), dto);
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task AcceptVvn_ShouldReturnOk_WhenSuccess()
        {
            var vvn = BuildDto(Guid.NewGuid().ToString(), "2025-THPA-000001", VvnStatus.Submitted.ToString());
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(vvn);
            _serviceMock.Setup(s => s.AcceptVvnAsync(It.IsAny<VvnCode>())).ReturnsAsync(vvn);

            var result = await _controller.AcceptVvn(Guid.Parse(vvn.Id));
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task AcceptVvn_ShouldReturnBadRequest_WhenInvalid()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid"));

            var result = await _controller.AcceptVvn(Guid.NewGuid());
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task RejectVvn_ShouldReturnOk_WhenSuccess()
        {
            var dto = new RejectVesselVisitNotificationDto("2025-THPA-000001", "Missing docs");
            var vvn = BuildDto(Guid.NewGuid().ToString(), dto.VvnCode, VvnStatus.PendingInformation.ToString());
            _serviceMock.Setup(s => s.MarkAsPendingAsync(dto)).ReturnsAsync(vvn);

            var result = await _controller.RejectVvn(dto);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task RejectVvn_ShouldReturnBadRequest_WhenInvalid()
        {
            var dto = new RejectVesselVisitNotificationDto("code", "reason");
            _serviceMock.Setup(s => s.MarkAsPendingAsync(dto))
                .ThrowsAsync(new BusinessRuleValidationException("Invalid"));

            var result = await _controller.RejectVvn(dto);
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetInProgressOrPending_ShouldReturnOk_WhenSuccess()
        {
            var vvns = new List<VesselVisitNotificationDto> { BuildDto(Guid.NewGuid().ToString(), "C1", "InProgress") };
            _serviceMock.Setup(s =>
                    s.GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(
                        It.IsAny<Guid>(), It.IsAny<FilterInProgressPendingVvnStatusDto>()))
                .ReturnsAsync(vvns);

            var result = await _controller.GetInProgressOrPendingVvnsByFiltersAsync(Guid.NewGuid(), null, null, null, null);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetWithdrawn_ShouldReturnOk_WhenSuccess()
        {
            var vvns = new List<VesselVisitNotificationDto> { BuildDto(Guid.NewGuid().ToString(), "C2", "Withdrawn") };
            _serviceMock.Setup(s =>
                    s.GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync(
                        It.IsAny<Guid>(), It.IsAny<FilterWithdrawnVvnStatusDto>()))
                .ReturnsAsync(vvns);

            var result = await _controller.GetWithdrawnVvnsByFiltersAsync(Guid.NewGuid(), null, null, null, null);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetSubmitted_ShouldReturnOk_WhenSuccess()
        {
            var vvns = new List<VesselVisitNotificationDto> { BuildDto(Guid.NewGuid().ToString(), "C3", "Submitted") };
            _serviceMock.Setup(s =>
                    s.GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(
                        It.IsAny<Guid>(), It.IsAny<FilterSubmittedVvnStatusDto>()))
                .ReturnsAsync(vvns);

            var result = await _controller.GetSubmittedVvnsByFiltersAsync(Guid.NewGuid(), null, null, null, null, null);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetAccepted_ShouldReturnOk_WhenSuccess()
        {
            var vvns = new List<VesselVisitNotificationDto> { BuildDto(Guid.NewGuid().ToString(), "C4", "Accepted") };
            _serviceMock.Setup(s =>
                    s.GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(
                        It.IsAny<Guid>(), It.IsAny<FilterAcceptedVvnStatusDto>()))
                .ReturnsAsync(vvns);

            var result = await _controller.GetAcceptedVvnsByFiltersAsync(Guid.NewGuid(), null, null, null, null, null, null);
            Assert.IsType<OkObjectResult>(result.Result);
        }

        private static VesselVisitNotificationDto BuildDto(string id, string code, string status, int volume = 1000)
        {
            return new VesselVisitNotificationDto(
                id,
                code,
                DateTime.Now.AddDays(1),
                DateTime.Now.AddDays(2),
                null,
                null,
                null,
                volume,
                new PdfDocumentCollection(),
                "DK-001",
                status,
                null,
                null,
                null,
                "IMO1234567",
                new List<TaskDto>()
            );
        }
    }
}
