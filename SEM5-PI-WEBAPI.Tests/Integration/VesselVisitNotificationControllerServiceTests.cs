using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
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
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using Status = SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class VesselVisitNotificationControllerServiceTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<ICargoManifestRepository> _cargoManifestRepoMock = new();
        private readonly Mock<ICargoManifestEntryRepository> _cargoManifestEntryRepoMock = new();
        private readonly Mock<ICrewManifestRepository> _crewManifestRepoMock = new();
        private readonly Mock<ICrewMemberRepository> _crewMemberRepoMock = new();
        private readonly Mock<IStorageAreaRepository> _storageRepoMock = new();
        private readonly Mock<IShippingAgentRepresentativeRepository> _sarRepoMock = new();
        private readonly Mock<IShippingAgentOrganizationRepository> _saoRepoMock = new();
        private readonly Mock<IVesselRepository> _vesselRepoMock = new();
        private readonly Mock<IDockRepository> _dockRepoMock = new();
        private readonly Mock<IContainerRepository> _containerRepoMock = new();
        private readonly Mock<IVesselVisitNotificationRepository> _vvnRepoMock = new();
        private readonly Mock<ITaskRepository> _taskRepoMock = new();

        private readonly Mock<ILogger<VesselVisitNotificationService>> _serviceLogger = new();
        private readonly Mock<ILogger<VesselVisitNotificationController>> _controllerLogger = new();

        private readonly VesselVisitNotificationService _service;
        private readonly VesselVisitNotificationController _controller;

        public VesselVisitNotificationControllerServiceTests()
        {
            _service = new VesselVisitNotificationService(
                _uowMock.Object,
                _cargoManifestRepoMock.Object,
                _cargoManifestEntryRepoMock.Object,
                _crewManifestRepoMock.Object,
                _crewMemberRepoMock.Object,
                _storageRepoMock.Object,
                _sarRepoMock.Object,
                _saoRepoMock.Object,
                _vesselRepoMock.Object,
                _dockRepoMock.Object,
                _containerRepoMock.Object,
                _vvnRepoMock.Object,
                _taskRepoMock.Object,
                _serviceLogger.Object
            );

            _controller = new VesselVisitNotificationController(_service, _controllerLogger.Object);
        }


        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var vesselTypeId = new VesselTypeId(Guid.NewGuid());
            var vessel = new Vessel("IMO 1234567", "Ever Given", "Evergreen Marine", vesselTypeId);
            var phone = new PhoneNumber("+351912345678");
            _sarRepoMock.Setup(r => r.GetByEmailAsync(It.Is<string>(e =>
                    e.Equals("agent@example.com", StringComparison.OrdinalIgnoreCase))))
                .ReturnsAsync(new ShippingAgentRepresentative(
                    "João Silva",
                    new CitizenId("A123456"),
                    Nationality.Portugal,
                    "agent@example.com",
                    phone,
                    Status.activated,
                    new ShippingOrganizationCode("1234567890")
                ));

            _crewManifestRepoMock.Setup(r => r.AddAsync(It.IsAny<CrewManifest>()))
                .ReturnsAsync((CrewManifest cm) => cm);

            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync(vessel);

            _vvnRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<VesselVisitNotification>());
            _vvnRepoMock.Setup(r => r.AddAsync(It.IsAny<VesselVisitNotification>()))
                .ReturnsAsync((VesselVisitNotification v) => v);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new CreatingVesselVisitNotificationDto(
                DateTime.Now.AddHours(1).ToString("O"),
                DateTime.Now.AddHours(2).ToString("O"),
                1500,
                "manifest.pdf",
                new CreatingCrewManifestDto(5, "Captain John", new List<CreatingCrewMemberDto>
                {
                    new("John Doe", CrewRole.Captain, Nationality.Portugal, "CIT1234")
                }),
                null,
                null,
                "IMO 1234567",
                "agent@example.com"
            );

            var result = await _controller.CreateAsync(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<VesselVisitNotificationDto>(created.Value);
            Assert.Equal("1234567", value.VesselImo); 
            Assert.Equal(1500, value.Volume);
        }



        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenInvalidImo()
        {
            _vesselRepoMock.Setup(r => r.GetByImoNumberAsync(It.IsAny<ImoNumber>()))
                .ReturnsAsync((Vessel?)null);

            var dto = new CreatingVesselVisitNotificationDto(
                DateTime.Now.AddHours(1).ToString("O"),
                DateTime.Now.AddHours(2).ToString("O"),
                1500,
                "manifest.pdf",
                new CreatingCrewManifestDto(3, "Captain", new List<CreatingCrewMemberDto>
                {
                    new("Jack", CrewRole.AbleSeaman, Nationality.Spain, "CIT9999")
                }),
                null,
                null,
                "IMO 0000000",
                "agent@example.com"
            );

            var result = await _controller.CreateAsync(dto);
            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Vessel", bad.Value!.ToString());
        }


        [Fact]
        public async Task GetById_ShouldReturnOk_WhenExists()
        {
            var vvn = BuildSampleVvn();
            _vvnRepoMock.Setup(r => r.GetCompleteByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ReturnsAsync(vvn);

            var result = await _controller.GetById(vvn.Id.AsGuid());
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<VesselVisitNotificationDto>(ok.Value);
            Assert.Equal(vvn.Code.Code, dto.Code);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenNotExists()
        {
            _vvnRepoMock.Setup(r => r.GetCompleteByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ReturnsAsync((VesselVisitNotification?)null);

            var result = await _controller.GetById(Guid.NewGuid());
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }
        
        
        [Fact]
        public async Task Update_ShouldReturnOk_WhenEditable()
        {
            var vvn = BuildSampleVvn();
            _vvnRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ReturnsAsync(vvn);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new UpdateVesselVisitNotificationDto
            {
                Volume = 2500
            };

            var result = await _controller.UpdateAsync(vvn.Id.AsGuid(), dto);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var updated = Assert.IsType<VesselVisitNotificationDto>(ok.Value);
            Assert.Equal(2500, updated.Volume);
        }

        [Fact]
        public async Task Update_ShouldReturnBadRequest_WhenNotEditable()
        {
            var vvn = BuildSampleVvn();
            vvn.Submit();
            _vvnRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<VesselVisitNotificationId>()))
                .ReturnsAsync(vvn);

            var dto = new UpdateVesselVisitNotificationDto { Volume = 999 };
            var result = await _controller.UpdateAsync(vvn.Id.AsGuid(), dto);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }


        private static VesselVisitNotification BuildSampleVvn()
        {
            return new VesselVisitNotification(
                new VvnCode("2025", "000001"),
                new ClockTime(DateTime.Now.AddHours(1)),
                new ClockTime(DateTime.Now.AddHours(2)),
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
