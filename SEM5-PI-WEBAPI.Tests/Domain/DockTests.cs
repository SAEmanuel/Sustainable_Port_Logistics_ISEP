using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class DockTests
    {
        private static readonly VesselTypeId VT_A = new VesselTypeId(Guid.NewGuid());
        private static readonly VesselTypeId VT_B = new VesselTypeId(Guid.NewGuid());

        private static EntityDock CreateValidDock(
            string code = "DK-0001",
            IEnumerable<string>? prcs = null,
            string location = "Terminal Norte A-3",
            double length = 350.0,
            double depth = 15.5,
            double maxDraft = 14.8,
            IEnumerable<VesselTypeId>? vtIds = null)
        {
            var prcList = (prcs ?? new[] { "ABC-1234", "XYZ-5678" }).Select(x => new PhysicalResourceCode(x));
            var vts = vtIds ?? new[] { VT_A };

            return new EntityDock(
                new DockCode(code),
                prcList,
                location,
                length,
                depth,
                maxDraft,
                vts,
                DockStatus.Available
            );
        }

        [Fact]
        public void CreateDock_WithValidData_ShouldSucceed()
        {
            var dock = CreateValidDock();

            Assert.NotNull(dock.Id);
            Assert.Equal("DK-0001", dock.Code.Value);
            Assert.Equal("Terminal Norte A-3", dock.Location);
            Assert.Equal(350.0, dock.LengthM);
            Assert.Equal(15.5, dock.DepthM);
            Assert.Equal(14.8, dock.MaxDraftM);
            Assert.Equal(DockStatus.Available, dock.Status);
            Assert.True(dock.PhysicalResourceCodes.Count >= 1);
            Assert.True(dock.AllowedVesselTypeIds.Count >= 1);
        }

        [Fact]
        public void CreateDock_ShouldRoundNumericFields_ToTwoDecimals()
        {
            var dock = CreateValidDock(length: 123.456, depth: 7.999, maxDraft: 9.001);

            Assert.Equal(123.46, dock.LengthM);
            Assert.Equal(8.00, dock.DepthM);
            Assert.Equal(9.00, dock.MaxDraftM);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void SetLength_Invalid_ShouldThrow(double invalid)
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.SetLength(invalid));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-0.1)]
        public void SetDepth_Invalid_ShouldThrow(double invalid)
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.SetDepth(invalid));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-10)]
        public void SetMaxDraft_Invalid_ShouldThrow(double invalid)
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.SetMaxDraft(invalid));
        }

        [Fact]
        public void SetLocation_Empty_ShouldThrow()
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.SetLocation("  "));
        }

        [Fact]
        public void SetCode_Null_ShouldThrow()
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.SetCode(null!));
        }

        [Theory]
        [InlineData("X-1")]
        [InlineData("DK-1")]
        [InlineData("DK-00001")]
        [InlineData("dk-0001")]
        public void CreateDock_InvalidDockCode_ShouldThrow(string invalidCode)
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                CreateValidDock(code: invalidCode));
        }

        [Fact]
        public void ReplacePhysicalResourceCodes_ShouldReplaceAndDeduplicate()
        {
            var dock = CreateValidDock(prcs: new[] { "ABC-1234" });

            dock.ReplacePhysicalResourceCodes(new[]
            {
                new PhysicalResourceCode("PFX-0001"),
                new PhysicalResourceCode("PFX-0001"),
                new PhysicalResourceCode("RES-0002")
            });

            Assert.Equal(2, dock.PhysicalResourceCodes.Count);
            Assert.Contains(dock.PhysicalResourceCodes, x => x.Value == "PFX-0001");
            Assert.Contains(dock.PhysicalResourceCodes, x => x.Value == "RES-0002");
        }


        [Fact]
        public void ReplacePhysicalResourceCodes_Null_ShouldThrow()
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() =>
                dock.ReplacePhysicalResourceCodes(null!));
        }

        [Fact]
        public void ReplacePhysicalResourceCodes_WithInvalidItem_ShouldThrow()
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() =>
                dock.ReplacePhysicalResourceCodes(new[] { new PhysicalResourceCode(""), }));
        }

        [Fact]
        public void ReplaceAllowedVesselTypes_ShouldReplace()
        {
            var dock = CreateValidDock(vtIds: new[] { VT_A, VT_B });
            dock.ReplaceAllowedVesselTypes(new[] { VT_A });
            Assert.Single(dock.AllowedVesselTypeIds);
        }

        [Fact]
        public void ReplaceAllowedVesselTypes_Empty_ShouldThrow()
        {
            var dock = CreateValidDock(vtIds: new[] { VT_A });
            Assert.Throws<BusinessRuleValidationException>(() =>
                dock.ReplaceAllowedVesselTypes(Array.Empty<VesselTypeId>()));
        }

        [Fact]
        public void AllowVesselType_WithEmptyGuid_ShouldThrow()
        {
            var dock = CreateValidDock();
            Assert.Throws<BusinessRuleValidationException>(() => dock.AllowVesselType(new VesselTypeId(Guid.Empty)));
        }

        [Fact]
        public void DisallowVesselType_WhenItWouldBecomeEmpty_ShouldThrow()
        {
            var dock = CreateValidDock(vtIds: new[] { VT_A });
            Assert.Throws<BusinessRuleValidationException>(() => dock.DisallowVesselType(VT_A));
        }

        [Fact]
        public void EnsureHasAllowedVesselTypes_WhenEmpty_ShouldThrow()
        {
            var dock = CreateValidDock(vtIds: new[] { VT_A, VT_B });
            Assert.Throws<BusinessRuleValidationException>(() =>
                dock.ReplaceAllowedVesselTypes(Array.Empty<VesselTypeId>()));
        }

        [Fact]
        public void SetStatus_ShouldChangeStatus()
        {
            var dock = CreateValidDock();
            dock.SetStatus(DockStatus.Maintenance);
            Assert.Equal(DockStatus.Maintenance, dock.Status);
        }

        [Fact]
        public void MarkUnavailable_ShouldSetStatusUnavailable()
        {
            var dock = CreateValidDock();
            dock.MarkUnavailable();
            Assert.Equal(DockStatus.Unavailable, dock.Status);
        }

        [Fact]
        public void SetLocation_ShouldTrim()
        {
            var dock = CreateValidDock(location: " X ");
            Assert.Equal("X", dock.Location);
        }
    }
}
