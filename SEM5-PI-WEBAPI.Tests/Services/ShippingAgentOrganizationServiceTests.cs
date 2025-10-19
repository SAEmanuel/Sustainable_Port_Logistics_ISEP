using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class ShippingAgentOrganizationServiceTests
    {
        private readonly Mock<IShippingAgentOrganizationRepository> _repoMock = new();
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<ILogger<ShippingAgentOrganizationService>> _loggerMock = new();

        private readonly ShippingAgentOrganizationService _service;

        public ShippingAgentOrganizationServiceTests()
        {
            _service = new ShippingAgentOrganizationService(_loggerMock.Object, _uowMock.Object, _repoMock.Object);
        }

        [Fact]
        public async Task GetAll_ShouldReturnAllOrganizations()
        {
            var code1 = new ShippingOrganizationCode("0000000001");
            var code2 = new ShippingOrganizationCode("0000000002");
            var orgs = new List<ShippingAgentOrganization>
            {
                new ShippingAgentOrganization(code1, "Legal One", "Alt One", "Addr One", new TaxNumber("PT000000001")),
                new ShippingAgentOrganization(code2, "Legal Two", "Alt Two", "Addr Two", new TaxNumber("PT000000002"))
            };

            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(orgs);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Contains(result, o => o.LegalName == "Legal One");
            Assert.Contains(result, o => o.ShippingOrganizationCode == code2);
        }

        [Fact]
        public async Task GetById_ShouldReturnOrganization_WhenExists()
        {
            var org = new ShippingAgentOrganization(new ShippingOrganizationCode("0000000003"), "Legal Three", "Alt Three", "Addr Three", new TaxNumber("PT000000003"));
            _repoMock.Setup(r => r.GetByIdAsync(org.Id)).ReturnsAsync(org);

            var result = await _service.GetByIdAsync(org.Id);

            Assert.NotNull(result);
            Assert.Equal("Legal Three", result.LegalName);
        }

        [Fact]
        public async Task GetById_ShouldReturnNull_WhenNotFound()
        {
            var id = new ShippingAgentOrganizationId(Guid.NewGuid());
            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ShippingAgentOrganization)null);

            var result = await _service.GetByIdAsync(id);

            Assert.Null(result);
        }

        [Fact]
        public async Task Create_ShouldReturnCreatedOrganization_WhenValid()
        {
            var dto = new CreatingShippingAgentOrganizationDto("0000000004", "Legal Four", "Alt Four", "Addr Four", "PT000000004");

            _repoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync((ShippingAgentOrganization)null);
            _repoMock.Setup(r => r.GetByTaxNumberAsync(It.IsAny<TaxNumber>())).ReturnsAsync((ShippingAgentOrganization)null);
            _repoMock.Setup(r => r.GetByLegalNameAsync(It.IsAny<string>())).ReturnsAsync((ShippingAgentOrganization)null);

            _repoMock.Setup(r => r.AddAsync(It.IsAny<ShippingAgentOrganization>())).ReturnsAsync((ShippingAgentOrganization org) => org);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.CreateAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(new ShippingOrganizationCode(dto.ShippingOrganizationCode), result.ShippingOrganizationCode);
            Assert.Equal(dto.LegalName, result.LegalName);
        }

        [Fact]
        public async Task Create_ShouldThrow_WhenCodeExists()
        {
            var dto = new CreatingShippingAgentOrganizationDto("0000000005", "Legal Five", "Alt Five", "Addr Five", "PT000000005");
            var existing = new ShippingAgentOrganization(new ShippingOrganizationCode(dto.ShippingOrganizationCode), "Legal X", "Alt X", "Addr X", new TaxNumber("PT999999999"));

            _repoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync(existing);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task Create_ShouldThrow_WhenTaxNumberExists()
        {
            var dto = new CreatingShippingAgentOrganizationDto("0000000006", "Legal Six", "Alt Six", "Addr Six", "PT000000006");
            var existing = new ShippingAgentOrganization(new ShippingOrganizationCode("9999999999"), "Legal X", "Alt X", "Addr X", new TaxNumber(dto.Taxnumber));

            _repoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync((ShippingAgentOrganization)null);
            _repoMock.Setup(r => r.GetByTaxNumberAsync(It.IsAny<TaxNumber>())).ReturnsAsync(existing);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task Create_ShouldThrow_WhenLegalNameExists()
        {
            var dto = new CreatingShippingAgentOrganizationDto("0000000007", "Legal Seven", "Alt Seven", "Addr Seven", "PT000000007");
            var existing = new ShippingAgentOrganization(new ShippingOrganizationCode("0000000008"), dto.LegalName, "Alt X", "Addr X", new TaxNumber("PT000000008"));

            _repoMock.Setup(r => r.GetByCodeAsync(It.IsAny<ShippingOrganizationCode>())).ReturnsAsync((ShippingAgentOrganization)null);
            _repoMock.Setup(r => r.GetByTaxNumberAsync(It.IsAny<TaxNumber>())).ReturnsAsync((ShippingAgentOrganization)null);
            _repoMock.Setup(r => r.GetByLegalNameAsync(It.IsAny<string>())).ReturnsAsync(existing);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task GetByLegalName_ShouldReturnOrganization_WhenExists()
        {
            var org = new ShippingAgentOrganization(new ShippingOrganizationCode("0000000008"), "Legal Eight", "Alt Eight", "Addr Eight", new TaxNumber("PT000000008"));
            _repoMock.Setup(r => r.GetByLegalNameAsync(org.LegalName)).ReturnsAsync(org);

            var result = await _service.GetByLegalNameAsync(org.LegalName);

            Assert.NotNull(result);
            Assert.Equal("Legal Eight", result.LegalName);
        }

        [Fact]
        public async Task GetByCode_ShouldReturnOrganization_WhenExists()
        {
            var code = new ShippingOrganizationCode("0000000009");
            var org = new ShippingAgentOrganization(code, "Legal Nine", "Alt Nine", "Addr Nine", new TaxNumber("PT000000009"));
            _repoMock.Setup(r => r.GetByCodeAsync(org.ShippingOrganizationCode)).ReturnsAsync(org);

            var result = await _service.GetByCodeAsync(org.ShippingOrganizationCode);

            Assert.NotNull(result);
            Assert.Equal(code, result.ShippingOrganizationCode);
        }

        [Fact]
        public async Task GetByTaxNumber_ShouldReturnOrganization_WhenExists()
        {
            var tax = new TaxNumber("PT000000010");
            var org = new ShippingAgentOrganization(new ShippingOrganizationCode("0000000010"), "Legal Ten", "Alt Ten", "Addr Ten", tax);
            _repoMock.Setup(r => r.GetByTaxNumberAsync(org.Taxnumber)).ReturnsAsync(org);

            var result = await _service.GetByTaxNumberAsync(org.Taxnumber);

            Assert.NotNull(result);
            Assert.Equal(tax, result.Taxnumber);
        }
    }
}
