using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Dock.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class DockServiceTests
    {
        private readonly Mock<IUnitOfWork> _uow = new();
        private readonly Mock<IDockRepository> _repo = new();
        private readonly Mock<IVesselTypeRepository> _vtRepo = new();
        private readonly Mock<ILogger<DockService>> _log = new();
        private readonly DockService _service;

        public DockServiceTests()
        {
            _service = new DockService(_uow.Object, _repo.Object, _vtRepo.Object, _log.Object);
        }

        private static EntityDock MakeDock(
            string code = "DK-0001",
            string location = "Terminal Norte A-3",
            double length = 350,
            double depth = 15.5,
            double draft = 14.8,
            DockStatus status = DockStatus.Available,
            IEnumerable<string>? prcs = null,
            IEnumerable<Guid>? vts = null)
        {
            var prcList = (prcs ?? new[] { "RES-0001", "CRN-0002" }).Select(x => new PhysicalResourceCode(x));
            var vtList  = (vts  ?? new[] { Guid.NewGuid() }).Select(g => new VesselTypeId(g));
            return new EntityDock(new DockCode(code), prcList, location, length, depth, draft, vtList, status);
        }

        private static RegisterDockDto MakeRegisterDto(
            string code = "DK-0001",
            string location = "Terminal Norte A-3",
            IEnumerable<string>? prcs = null,
            IEnumerable<string>? vtIds = null)
        {
            return new RegisterDockDto(
                code,
                prcs ?? new[] { "RES-0001", "CRN-0002" },
                location,
                350, 15.5, 14.8,
                vtIds ?? new[] { Guid.NewGuid().ToString() },
                DockStatus.Available
            );
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnDtos()
        {
            _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<EntityDock>
            {
                MakeDock("DK-0001"),
                MakeDock("DK-0002")
            });

            var list = await _service.GetAllAsync();

            Assert.Equal(2, list.Count);
            Assert.Equal("DK-0001", list[0].Code.Value);
        }

        [Fact]
        public async Task CreateAsync_ShouldCreate_WhenValid()
        {
            var vtId = Guid.NewGuid().ToString();
            var dto = MakeRegisterDto(vtIds: new[] { vtId });

            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync((EntityDock?)null);
            _vtRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>())).ReturnsAsync(new VesselType("A", 2, 2, 2, "Description that is valid for this test."));
            _repo.Setup(r => r.AddAsync(It.IsAny<EntityDock>()))
                .ReturnsAsync((EntityDock e) => e);
            _uow.Setup(u => u.CommitAsync())
                .ReturnsAsync(1);

            var created = await _service.CreateAsync(dto);

            Assert.Equal(dto.Code, created.Code.Value);
            _repo.Verify(r => r.AddAsync(It.IsAny<EntityDock>()), Times.Once);
            _uow.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenCodeExists()
        {
            var dto = MakeRegisterDto(code: "DK-0001");
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync(MakeDock("DK-0001"));

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("already exists", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenPrcExists()
        {
            var dto = MakeRegisterDto(prcs: new[] { "RES-0001" });
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync(MakeDock());
            _vtRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>())).ReturnsAsync(new VesselType("A", 2, 2, 2, "Description that is valid for this test."));

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("PhysicalResourceCode", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenNoVesselTypes()
        {
            var dto = MakeRegisterDto(vtIds: Array.Empty<string>());
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("At least one VesselTypeId is required", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenVesselTypeGuidInvalid()
        {
            var dto = MakeRegisterDto(vtIds: new[] { "not-a-guid" });
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("Invalid VesselTypeId", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenVesselTypeDoesNotExist()
        {
            var g = Guid.NewGuid().ToString();
            var dto = MakeRegisterDto(vtIds: new[] { g });
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync((EntityDock?)null);
            _vtRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>())).ReturnsAsync((VesselType?)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));
            Assert.Contains("does not exist", ex.Message);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturn_WhenFound()
        {
            var e = MakeDock("DK-0100");
            _repo.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync(e);

            var dto = await _service.GetByIdAsync(e.Id);

            Assert.Equal("DK-0100", dto.Code.Value);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrow_WhenMissing()
        {
            _repo.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync((EntityDock?)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByIdAsync(new DockId(Guid.NewGuid())));
            Assert.Contains("No dock found with Id", ex.Message);
        }

        [Fact]
        public async Task GetByCodeAsync_ShouldReturn_WhenFound()
        {
            var e = MakeDock("DK-0200");
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync(e);

            var dto = await _service.GetByCodeAsync("DK-0200");

            Assert.Equal("DK-0200", dto.Code.Value);
        }

        [Fact]
        public async Task GetByCodeAsync_ShouldThrow_WhenMissing()
        {
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByCodeAsync("DK-9999"));
        }

        [Fact]
        public async Task GetByPhysicalResourceCodeAsync_ShouldReturn_WhenFound()
        {
            var e = MakeDock(prcs: new[] { "ABC-1234" });
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync(e);

            var dto = await _service.GetByPhysicalResourceCodeAsync("ABC-1234");

            Assert.Contains(dto.PhysicalResourceCodes, p => p.Value == "ABC-1234");
        }

        [Fact]
        public async Task GetByPhysicalResourceCodeAsync_ShouldThrow_WhenMissing()
        {
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync((EntityDock?)null);

            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByPhysicalResourceCodeAsync("RES-0001"));
        }

        [Fact]
        public async Task GetByVesselTypeAsync_ShouldThrow_WhenGuidInvalid()
        {
            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByVesselTypeAsync("not-a-guid"));
        }

        [Fact]
        public async Task GetByVesselTypeAsync_ShouldReturnList_WhenFound()
        {
            var vt = new VesselTypeId(Guid.NewGuid());
            _repo.Setup(r => r.GetByVesselTypeAsync(vt)).ReturnsAsync(new List<EntityDock> { MakeDock("DK-0300") });

            var list = await _service.GetByVesselTypeAsync(vt.Value.ToString());

            Assert.Single(list);
            Assert.Equal("DK-0300", list[0].Code.Value);
        }

        [Fact]
        public async Task GetFilterAsync_ShouldReturnList()
        {
            _repo.Setup(r => r.GetFilterAsync(
                It.IsAny<DockCode?>(),
                It.IsAny<VesselTypeId?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DockStatus?>()))
                .ReturnsAsync(new List<EntityDock> { MakeDock("DK-0400") });

            var list = await _service.GetFilterAsync(code: "DK-0400", vesselTypeId: null, location: null, query: "DK", status: "Available");

            Assert.Single(list);
            Assert.Equal("DK-0400", list[0].Code.Value);
        }

        [Fact]
        public async Task GetFilterAsync_ShouldThrow_WhenVesselTypeIdInvalid()
        {
            await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.GetFilterAsync(code: null, vesselTypeId: "bad-guid", location: null, query: null, status: null));
        }

        [Fact]
        public async Task GetByLocationAsync_ShouldThrow_WhenEmpty()
        {
            await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByLocationAsync("  "));
        }

        [Fact]
        public async Task GetByLocationAsync_ShouldReturnList()
        {
            _repo.Setup(r => r.GetByLocationAsync("Norte")).ReturnsAsync(new List<EntityDock> { MakeDock(location: "Norte") });

            var list = await _service.GetByLocationAsync("Norte");

            Assert.Single(list);
            Assert.Equal("Norte", list[0].Location);
        }

        [Fact]
        public async Task PatchByCodeAsync_ShouldUpdate_WhenValid()
        {
            var current = MakeDock("DK-0500", prcs: new[] { "OLD-0001" }, vts: new[] { Guid.NewGuid() });
            _repo.Setup(r => r.GetByCodeAsync(It.Is<DockCode>(c => c.Value == "DK-0500"))).ReturnsAsync(current);
            _repo.Setup(r => r.GetByCodeAsync(It.Is<DockCode>(c => c.Value == "DK-0501"))).ReturnsAsync((EntityDock?)null);
            _repo.Setup(r => r.GetByPhysicalResourceCodeAsync(It.IsAny<PhysicalResourceCode>())).ReturnsAsync((EntityDock?)null);
            _vtRepo.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>())).ReturnsAsync(new VesselType("A", 2, 2, 2, "Description that is valid for this test."));
            _uow.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var dto = new UpdateDockDto
            {
                Code = "DK-0501",
                Location = "Terminal Sul B-1",
                DepthM = 16.0,
                PhysicalResourceCodes = new List<string> { "NEW-0001", "NEW-0002" },
                AllowedVesselTypeIds = new List<string> { Guid.NewGuid().ToString() },
                Status = DockStatus.Maintenance
            };

            var updated = await _service.PatchByCodeAsync("DK-0500", dto);

            Assert.Equal("DK-0501", updated.Code.Value);
            Assert.Equal("Terminal Sul B-1", updated.Location);
            Assert.Equal(DockStatus.Maintenance, updated.Status);
            Assert.Contains(updated.PhysicalResourceCodes, x => x.Value == "NEW-0001");
            _uow.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task PatchByCodeAsync_ShouldThrow_WhenDockMissing()
        {
            _repo.Setup(r => r.GetByCodeAsync(It.IsAny<DockCode>())).ReturnsAsync((EntityDock?)null);

            var dto = new UpdateDockDto { Location = "X" };

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.PatchByCodeAsync("DK-9999", dto));
            Assert.Contains("No dock found with Code", ex.Message);
        }

        [Fact]
        public async Task GetAllDockCodesAsync_ShouldReturnStrings()
        {
            _repo.Setup(r => r.GetAllDockCodesAsync()).ReturnsAsync(new List<DockCode> { new DockCode("DK-1000"), new DockCode("DK-1001") });

            var list = await _service.GetAllDockCodesAsync();

            Assert.Equal(new[] { "DK-1000", "DK-1001" }, list);
        }
    }
}
