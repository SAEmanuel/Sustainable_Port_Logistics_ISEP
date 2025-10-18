using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using Status = SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class VesselVisitNotificationServiceTests
    {
        private readonly Mock<IUnitOfWork> _uow = new();
        private readonly Mock<ICargoManifestRepository> _cargoManifestRepo = new();
        private readonly Mock<ICargoManifestEntryRepository> _cargoEntryRepo = new();
        private readonly Mock<ICrewManifestRepository> _crewManifestRepo = new();
        private readonly Mock<ICrewMemberRepository> _crewMemberRepo = new();
        private readonly Mock<IStorageAreaRepository> _storageRepo = new();
        private readonly Mock<IShippingAgentRepresentativeRepository> _sarRepo = new();
        private readonly Mock<IShippingAgentOrganizationRepository> _saoRepo = new();
        private readonly Mock<IVesselRepository> _vesselRepo = new();
        private readonly Mock<IDockRepository> _dockRepo = new();
        private readonly Mock<IContainerRepository> _containerRepo = new();
        private readonly Mock<IVesselVisitNotificationRepository> _vvnRepo = new();
        private readonly Mock<ITaskRepository> _taskRepo = new();
        private readonly Mock<ILogger<VesselVisitNotificationService>> _logger = new();

        private readonly VesselVisitNotificationService _service;

        public VesselVisitNotificationServiceTests()
        {
            _service = new VesselVisitNotificationService(
                _uow.Object,
                _cargoManifestRepo.Object,
                _cargoEntryRepo.Object,
                _crewManifestRepo.Object,
                _crewMemberRepo.Object,
                _storageRepo.Object,
                _sarRepo.Object,
                _saoRepo.Object,
                _vesselRepo.Object,
                _dockRepo.Object,
                _containerRepo.Object,
                _vvnRepo.Object,
                _taskRepo.Object,
                _logger.Object
            );
        }


        [Fact]
        public async Task AddAsync_ShouldCreate_WhenValid()
        {
            var vessel = new Vessel("IMO 1234567", "Ever Given", "Evergreen", new VesselTypeId(Guid.NewGuid()));
            var phone = new PhoneNumber("+351912345678");
            _sarRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(new ShippingAgentRepresentative(
                    "João Silva",
                    new CitizenId("A123456"),
                    Nationality.Portugal,
                    "agent@example.com",
                    phone,
                    Status.activated,
                    new ShippingOrganizationCode("1234567890")
                ));

            _vesselRepo.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(vessel);

            _vvnRepo.Setup(r => r.AddAsync(It.IsAny<VesselVisitNotification>()))
                .ReturnsAsync((VesselVisitNotification v) => v);

            _vvnRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<VesselVisitNotification>());

            _uow.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var crew = new CreatingCrewManifestDto(3, "Captain John", new List<CreatingCrewMemberDto>
            {
                new("John Doe", CrewRole.Captain, Nationality.Portugal, "CID123")
            });

            var dto = new CreatingVesselVisitNotificationDto(
                DateTime.UtcNow.AddHours(1).ToString("O"),
                DateTime.UtcNow.AddHours(2).ToString("O"),
                1200,
                "docs.pdf",
                crew,
                null,
                null,
                "IMO 1234567",
                "agent@example.com"
            );

            var result = await _service.AddAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("1234567", result.VesselImo);
        }


        [Fact]
        public async Task AddAsync_ShouldThrow_WhenVesselNotFound()
        {
            _vesselRepo.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>())).ReturnsAsync((Vessel)null);

            var dto = new CreatingVesselVisitNotificationDto(
                DateTime.UtcNow.ToString("O"),
                DateTime.UtcNow.AddHours(1).ToString("O"),
                1000,
                "docs.pdf",
                new CreatingCrewManifestDto(1, "Cap", new List<CreatingCrewMemberDto>()),
                null,
                null,
                "INVALID",
                "agent@example.com"
            );

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddAsync(dto));
        }
        


        [Fact]
        public async Task AcceptVvnAsync_ShouldThrow_WhenNoDockAvailable()
        {
            var vvn = BuildSample();
            var vtId = new VesselTypeId(Guid.NewGuid());

            _vvnRepo.Setup(r => r.GetByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync(vvn);
            _vvnRepo.Setup(r => r.GetCompleteByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(vvn);
            _dockRepo.Setup(r => r.GetAllDocksForVesselType(It.IsAny<VesselTypeId>()))
                .ReturnsAsync(new List<EntityDock>()); // empty

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.AcceptVvnAsync(new VvnCode("2025", "9999")));
        }


        [Fact]
        public async Task UpdateAsync_ShouldUpdate_WhenEditable()
        {
            var vvn = BuildSample();
            _vvnRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(vvn);
            _uow.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new UpdateVesselVisitNotificationDto { Volume = 2000 };

            var result = await _service.UpdateAsync(vvn.Id, dto);

            Assert.Equal(2000, result.Volume);
        }

        [Fact]
        public async Task UpdateAsync_ShouldThrow_WhenAlreadySubmitted()
        {
            var vvn = BuildSample();
            vvn.Submit();
            _vvnRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(vvn);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.UpdateAsync(vvn.Id, new UpdateVesselVisitNotificationDto { Volume = 2500 }));
        }
        
        [Fact]
        public async Task SubmitByCodeAsync_ShouldSubmit_WhenValid()
        {
            var vvn = BuildSample();
            _vvnRepo.Setup(r => r.GetCompleteByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync(vvn);
            _uow.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.SubmitByCodeAsync(new VvnCode("2025", "000001"));

            Assert.NotNull(result);
            _uow.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task SubmitByCodeAsync_ShouldThrow_WhenNotFound()
        {
            _vvnRepo.Setup(r => r.GetCompleteByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync((VesselVisitNotification)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.SubmitByCodeAsync(new VvnCode("2025", "9999")));
        }
        
        [Fact]
        public async Task WithdrawByIdAsync_ShouldWithdraw_WhenExists()
        {
            var vvn = BuildSample();
            _vvnRepo.Setup(r => r.GetCompleteByIdAsync(It.IsAny<VesselVisitNotificationId>())).ReturnsAsync(vvn);
            _uow.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.WithdrawByIdAsync(vvn.Id);

            Assert.Equal(vvn.Id.AsGuid(), Guid.Parse(result.Id));
        }

        [Fact]
        public async Task WithdrawByIdAsync_ShouldThrow_WhenNotFound()
        {
            _vvnRepo.Setup(r => r.GetCompleteByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ReturnsAsync((VesselVisitNotification)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.WithdrawByIdAsync(new VesselVisitNotificationId(Guid.NewGuid())));
        }


        [Fact]
        public async Task GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync_ShouldReturnEmpty_WhenNone()
        {
            var saoCode = new ShippingOrganizationCode("1234567890");
            var phone = new PhoneNumber("+351912345678");
            var sar = new ShippingAgentRepresentative(
                "John", new CitizenId("AB123456"), Nationality.Portugal, "john@example.com", phone, Status.activated, saoCode);

            _sarRepo.Setup(r => r.GetByIdAsync(It.IsAny<ShippingAgentRepresentativeId>()))
                .ReturnsAsync(sar);

            _saoRepo.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                .ReturnsAsync(new ShippingAgentOrganization(
                    saoCode, "Org", "Alt", "Addr", new TaxNumber("PT123456789")));

            _sarRepo.Setup(r => r.GetAllSarBySaoAsync(It.IsAny<ShippingOrganizationCode>()))
                .ReturnsAsync(new List<ShippingAgentRepresentative> { sar });

            var dto = new FilterInProgressPendingVvnStatusDto();

            var result = await _service.GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(Guid.NewGuid(), dto);

            Assert.Empty(result);
        }

        
        private static VesselVisitNotification BuildSample()
        {
            return new VesselVisitNotification(
                new VvnCode("2025", "000001"),
                new ClockTime(DateTime.UtcNow.AddHours(1)),
                new ClockTime(DateTime.UtcNow.AddHours(2)),
                1000,
                new PdfDocumentCollection(),
                null,
                null,
                null,
                new ImoNumber("IMO 1234567")
            );
        }
    }
}
