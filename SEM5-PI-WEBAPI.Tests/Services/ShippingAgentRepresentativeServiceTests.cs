using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using Xunit;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class ShippingAgentRepresentativeServiceTests
    {
        private readonly Mock<IShippingAgentRepresentativeRepository> _repoMock = new();
        private readonly Mock<IShippingAgentOrganizationRepository> _saoRepoMock = new();
        private readonly Mock<IVesselVisitNotificationRepository> _vvnRepoMock = new();
        private readonly Mock<IUnitOfWork> _uowMock = new();

        private readonly ShippingAgentRepresentativeService _service;

        private readonly SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status Activated =
            SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.activated;

        private readonly SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status Deactivated =
            SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.deactivated;

        public ShippingAgentRepresentativeServiceTests()
        {
            _service = new ShippingAgentRepresentativeService(
                _uowMock.Object,
                _repoMock.Object,
                _saoRepoMock.Object,
                _vvnRepoMock.Object
            );
        }

        [Fact]
        public async Task GetAll_ShouldReturnAllRepresentatives()
        {
            var reps = new List<ShippingAgentRepresentative>
            {
                new ShippingAgentRepresentative("John Doe", new CitizenId("A123456"), Nationality.Portugal,
                    new EmailAddress("john@doe.com"), new PhoneNumber("+351912345678"), Activated, new ShippingOrganizationCode("AB1234")),
                new ShippingAgentRepresentative("Jane Smith", new CitizenId("B987654"), Nationality.Spain,
                    new EmailAddress("jane@smith.com"), new PhoneNumber("+34912345678"), Deactivated, new ShippingOrganizationCode("ZX9876"))
            };

            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(reps);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Contains(result, r => r.Name == "John Doe");
            Assert.Contains(result, r => r.Status == Deactivated);
        }

        [Fact]
        public async Task GetById_ShouldReturnRepresentative_WhenExists()
        {
            var rep = new ShippingAgentRepresentative("John Doe", new CitizenId("C123456"), Nationality.Italy,
                new EmailAddress("john@doe.com"), new PhoneNumber("+390123456789"), Activated, new ShippingOrganizationCode("REP1234"));

            _repoMock.Setup(r => r.GetByIdAsync(rep.Id)).ReturnsAsync(rep);

            var result = await _service.GetByIdAsync(rep.Id);

            Assert.NotNull(result);
            Assert.Equal("John Doe", result.Name);
        }

        [Fact]
        public async Task AddAsync_ShouldCreateRepresentative_WhenValid()
        {
            var dto = new CreatingShippingAgentRepresentativeDto(
                "Alice Wonder",
                new CitizenId("D123456"),
                Nationality.France,
                new EmailAddress("alice@wonder.com"),
                new PhoneNumber("+33123456789"),
                "activated",
                "SAO12345"
            );

            _repoMock.Setup(r => r.GetByCitizenIdAsync(dto.CitizenId)).ReturnsAsync((ShippingAgentRepresentative)null);
            _repoMock.Setup(r => r.GetBySaoAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync((ShippingAgentRepresentative)null);
            _saoRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                .ReturnsAsync(new ShippingAgentOrganization(new ShippingOrganizationCode("SAO12345"),
                    "Legal Four", "Alt Four", "Addr Four", new TaxNumber("PT000000004")));

            _repoMock.Setup(r => r.AddAsync(It.IsAny<ShippingAgentRepresentative>()))
                .ReturnsAsync((ShippingAgentRepresentative r) => r);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.AddAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("Alice Wonder", result.Name);
            Assert.Equal("activated", result.Status.ToString().ToLower());
        }

        [Fact]
        public async Task AddAsync_ShouldThrow_WhenCitizenIdExists()
        {
            var dto = new CreatingShippingAgentRepresentativeDto(
                "Bob Builder",
                new CitizenId("E123456"),
                Nationality.Ukraine,
                new EmailAddress("bob@builder.com"),
                new PhoneNumber("+380123456789"),
                "activated",
                "SAO5678"
            );

            var existing = new ShippingAgentRepresentative("Someone", dto.CitizenId, Nationality.Spain,
                new EmailAddress("someone@old.com"), new PhoneNumber("+34123456789"), Deactivated, new ShippingOrganizationCode("OLD5678"));

            _repoMock.Setup(r => r.GetByCitizenIdAsync(dto.CitizenId)).ReturnsAsync(existing);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddAsync(dto));
        }

        [Fact]
        public async Task AddAsync_ShouldThrow_WhenSAO_NotFound()
        {
            var dto = new CreatingShippingAgentRepresentativeDto(
                "Carlos",
                new CitizenId("F123456"),
                Nationality.Brazil,
                new EmailAddress("carlos@mail.com"),
                new PhoneNumber("+5511987654321"),
                "activated",
                "MISSING1"
            );

            _repoMock.Setup(r => r.GetByCitizenIdAsync(dto.CitizenId)).ReturnsAsync((ShippingAgentRepresentative)null);
            _saoRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>()))
                .ReturnsAsync((ShippingAgentOrganization)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddAsync(dto));
        }

        [Fact]
        public async Task AddAsync_ShouldThrow_WhenSAOAlreadyHasRepresentative()
        {
            var dto = new CreatingShippingAgentRepresentativeDto(
                "Debbie",
                new CitizenId("G123456"),
                Nationality.Italy,
                new EmailAddress("deb@debbie.com"),
                new PhoneNumber("+390123456789"),
                "activated",
                "REP2222"
            );

            var sao = new ShippingAgentOrganization(new ShippingOrganizationCode("REP2222"),
                "Legal Seven", "Alt Seven", "Addr Seven", new TaxNumber("PT000000007"));
            var existingRep = new ShippingAgentRepresentative("Existing", new CitizenId("Z987654"),
                Nationality.Spain, new EmailAddress("exist@mail.com"), new PhoneNumber("+34111222333"), Activated, sao.ShippingOrganizationCode);

            _repoMock.Setup(r => r.GetByCitizenIdAsync(dto.CitizenId)).ReturnsAsync((ShippingAgentRepresentative)null);
            _saoRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync(sao);
            _repoMock.Setup(r => r.GetBySaoAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync(existingRep);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddAsync(dto));
        }

        [Fact]
        public async Task AddNotificationAsync_ShouldAddNotification_WhenValid()
        {
            var eta = new ClockTime(DateTime.UtcNow);
            var etd = new ClockTime(DateTime.UtcNow.AddHours(12));
            var imo = new ImoNumber("IMO 9234563");

            var vvn = new VesselVisitNotification(
                new VvnCode("2024", "000001"),
                eta,
                etd,
                1,
                null,
                null,
                null,
                null,
                imo
            );

            var rep = new ShippingAgentRepresentative("Eddie", new CitizenId("H123456"), Nationality.Portugal,
                new EmailAddress("eddie@mail.com"), new PhoneNumber("+351911111111"), Activated, new ShippingOrganizationCode("AGENT88"));

            _repoMock.Setup(r => r.GetByNameAsync(rep.Name)).ReturnsAsync(rep);
            _vvnRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<VvnCode>())).ReturnsAsync(vvn);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.AddNotificationAsync(rep.Name, "2024-THPA-000001");

            Assert.NotNull(result);
            Assert.Contains(result.Notifs, n => n.Code == "2024-THPA-000001");
        }

        [Fact]
        public async Task AddNotificationAsync_ShouldThrow_WhenVVNNotFound()
        {
            var rep = new ShippingAgentRepresentative("Fiona", new CitizenId("I123456"), Nationality.France,
                new EmailAddress("fiona@mail.com"), new PhoneNumber("+33111111111"), Activated, new ShippingOrganizationCode("FR00123"));

            _repoMock.Setup(r => r.GetByNameAsync(rep.Name)).ReturnsAsync(rep);
            _vvnRepoMock.Setup(r => r.GetByCodeAsync(It.IsAny<VvnCode>()))
                .ReturnsAsync((VesselVisitNotification)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.AddNotificationAsync(rep.Name, "2024-THPA-999999"));
        }
    }
}
