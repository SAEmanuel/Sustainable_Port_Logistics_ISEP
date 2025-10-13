using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;


namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class VesselVisitNotificationTests
    {
        private VvnCode ValidCode => new("2025", "000001");
        private ClockTime ValidETA => new(DateTime.Now.AddDays(1));
        private ClockTime ValidETD => new(DateTime.Now.AddDays(2));
        private ImoNumber ValidImo => new("IMO 1234567");
        private static PdfDocumentCollection EmptyDocuments => new();

        private List<EntityDock> ValidDocks => new()
        {
            BuildValidDock("DK-0001", "North Terminal Dock")
        };

        [Fact]
        public void CreateVesselVisitNotification_WithValidData_ShouldInitializeCorrectly()
        {
            var vvn = CreateValidVVN();

            Assert.Equal(VvnStatus.InProgress, vvn.Status.StatusValue);
            Assert.True(vvn.IsEditable);
            Assert.Equal("2025-THPA-000001", vvn.Code.Code);
            Assert.Equal(1200, vvn.Volume);
            Assert.NotEmpty(vvn.ListDocks);
            Assert.Null(vvn.ActualTimeArrival);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithInvalidVolume_ShouldThrowException()
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new VesselVisitNotification(ValidCode, ValidETA, ValidETD, -10,
                    EmptyDocuments, ValidDocks, null, null, null, ValidImo));
        }

        [Fact]
        public void CreateVesselVisitNotification_WithNullDocuments_ShouldInitializeEmptyCollection()
        {
            var vvn = new VesselVisitNotification(
                ValidCode, ValidETA, ValidETD, 800,
                null, ValidDocks, null, null, null, ValidImo);

            Assert.NotNull(vvn.Documents);
            Assert.Empty(vvn.Documents.Pdfs);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithEmptyDockList_ShouldInitializeEmpty()
        {
            var vvn = new VesselVisitNotification(
                ValidCode, ValidETA, ValidETD, 800,
                EmptyDocuments, new List<EntityDock>(), null, null, null, ValidImo);

            Assert.NotNull(vvn.ListDocks);
            Assert.Empty(vvn.ListDocks);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithInvalidTimeOrder_ShouldThrow()
        {
            var eta = new ClockTime(DateTime.Now.AddDays(3));
            var etd = new ClockTime(DateTime.Now.AddDays(1));

            Assert.Throws<BusinessRuleValidationException>(() =>
                new VesselVisitNotification(
                    ValidCode, eta, etd, 400,
                    EmptyDocuments, ValidDocks, null, null, null, ValidImo));
        }

        [Fact]
        public void Submit_ShouldChangeStatusToSubmitted_AndLockEdits()
        {
            var vvn = CreateValidVVN();

            vvn.Submit();

            Assert.Equal(VvnStatus.Submitted, vvn.Status.StatusValue);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Submit_WhenAlreadySubmitted_ShouldThrowException()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.Submit());
        }

        [Fact]
        public void Withdraw_ShouldSetStatusToWithdrawn_AndDisableEdits()
        {
            var vvn = CreateValidVVN();

            vvn.Withdraw();

            Assert.Equal(VvnStatus.Withdrawn, vvn.Status.StatusValue);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Withdraw_WhenAccepted_ShouldThrowException()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.Withdraw());
        }

        [Fact]
        public void Resume_ShouldReopenWithdrawnVVN()
        {
            var vvn = CreateValidVVN();
            vvn.Withdraw();
            vvn.Resume();

            Assert.Equal(VvnStatus.InProgress, vvn.Status.StatusValue);
            Assert.True(vvn.IsEditable);
        }

        [Fact]
        public void Resume_WhenNotWithdrawn_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Resume());
        }

        [Fact]
        public void Accept_ShouldSetStatusToAccepted_AndRecordAcceptanceDate()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.Equal(VvnStatus.Accepted, vvn.Status.StatusValue);
            Assert.NotNull(vvn.AcceptenceDate);
            Assert.False(vvn.IsEditable);
            Assert.Contains("VVN", vvn.ToString());
        }

        [Fact]
        public void Accept_WhenNotSubmitted_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Accept());
        }

        [Fact]
        public void MarkPending_ShouldSetStatusToPending_AndKeepEditable()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.MarkPending("Too bad...");

            Assert.Equal(VvnStatus.PendingInformation, vvn.Status.StatusValue);
            Assert.True(vvn.IsEditable);
        }

        [Fact]
        public void MarkPending_WhenInProgress_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.MarkPending("Bad..."));
        }

        [Fact]
        public void FullLifecycle_ShouldFollowValidTransitions()
        {
            var vvn = CreateValidVVN();

            vvn.Submit();
            Assert.Equal(VvnStatus.Submitted, vvn.Status.StatusValue);

            vvn.MarkPending("Xu...");
            Assert.Equal(VvnStatus.PendingInformation, vvn.Status.StatusValue);

            vvn.Withdraw();
            Assert.Equal(VvnStatus.Withdrawn, vvn.Status.StatusValue);

            vvn.Resume();
            Assert.Equal(VvnStatus.InProgress, vvn.Status.StatusValue);

            vvn.Submit();
            vvn.Accept();
            Assert.Equal(VvnStatus.Accepted, vvn.Status.StatusValue);
        }

        [Fact]
        public void UpdateMethods_ShouldModifyValues_WhenEditable()
        {
            var vvn = CreateValidVVN();
            var newETA = new ClockTime(DateTime.Now.AddDays(5));
            var newETD = new ClockTime(DateTime.Now.AddDays(6));
            var newDocks = new List<EntityDock> { BuildValidDock("DK-0002", "Dock 2") };

            vvn.UpdateEstimatedTimeDeparture(newETD);
            vvn.UpdateEstimatedTimeArrival(newETA);
            vvn.UpdateVolume(999);
            vvn.UpdateListDocks(newDocks);

            Assert.Equal(newETA, vvn.EstimatedTimeArrival);
            Assert.Equal(newETD, vvn.EstimatedTimeDeparture);
            Assert.Equal(999, vvn.Volume);
            Assert.Equal("DK-0002", vvn.ListDocks.First().Code.Value);
        }

        [Fact]
        public void UpdateMethods_ShouldThrow_WhenNotEditable()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateVolume(200));
            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateEstimatedTimeArrival(new ClockTime(DateTime.Now.AddDays(3))));
        }

        [Fact]
        public void UpdateVolume_WithNegativeValue_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateVolume(-20));
        }

        [Fact]
        public void Equals_ShouldReturnTrue_WhenCodesMatch()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000001"), ValidETA, ValidETD, 500,
                EmptyDocuments, ValidDocks, null, null, null, ValidImo);

            Assert.True(vvn1.Equals(vvn2));
            Assert.Equal(vvn1.GetHashCode(), vvn2.GetHashCode());
        }

        [Fact]
        public void Equals_ShouldReturnFalse_WhenCodesDiffer()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000002"), ValidETA, ValidETD, 500,
                EmptyDocuments, ValidDocks, null, null, null, ValidImo);

            Assert.False(vvn1.Equals(vvn2));
        }

        [Fact]
        public void ToString_ShouldReturnReadableRepresentation()
        {
            var vvn = CreateValidVVN();
            var str = vvn.ToString();

            Assert.Contains("VVN", str);
            Assert.Contains(vvn.Code.Code, str);
            Assert.Contains(vvn.Status.ToString(), str);
        }

        private VesselVisitNotification CreateValidVVN()
        {
            return new VesselVisitNotification(
                ValidCode,
                ValidETA,
                ValidETD,
                1200,
                EmptyDocuments,
                ValidDocks,
                null, null, null,
                ValidImo
            );
        }

        private static EntityDock BuildValidDock(string code, string name)
        {
            var vesselTypes = new List<VesselTypeId> { new VesselTypeId(Guid.NewGuid()) };
            var physicalResources = new List<PhysicalResourceCode> { new PhysicalResourceCode("RSC-1234") };

            return new EntityDock(new DockCode(code), physicalResources, name, 15.0d, 350.0d, 12.0d, vesselTypes);
        }
    }
}
