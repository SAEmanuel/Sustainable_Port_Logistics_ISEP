using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using TaskStatus = SEM5_PI_WEBAPI.Domain.Tasks.TaskStatus;

namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class VesselVisitNotificationTests
    {
        private VvnCode ValidCode => new("2025", "000001");
        private ClockTime ValidETA => new(DateTime.Now.AddDays(1));
        private ClockTime ValidETD => new(DateTime.Now.AddDays(2));
        private ImoNumber ValidImo => new("IMO 1234567");
        private static PdfDocumentCollection EmptyDocs => new();
        private DockCode DockA => new("DK-0001");

        private VesselVisitNotification CreateValidVVN()
        {
            return new VesselVisitNotification(
                ValidCode,
                ValidETA,
                ValidETD,
                1200,
                EmptyDocs,
                null, null, null,
                ValidImo
            );
        }
        
        [Fact]
        public void Create_WithValidData_ShouldInitializeCorrectly()
        {
            var vvn = CreateValidVVN();

            Assert.Equal(VvnStatus.InProgress, vvn.Status.StatusValue);
            Assert.True(vvn.IsEditable);
            Assert.Equal("2025-THPA-000001", vvn.Code.Code);
            Assert.Equal(1200, vvn.Volume);
            Assert.Null(vvn.ActualTimeArrival);
            Assert.NotNull(vvn.Documents);
        }

        [Fact]
        public void Create_WithInvalidVolume_ShouldThrow()
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new VesselVisitNotification(ValidCode, ValidETA, ValidETD, -5, EmptyDocs, null, null, null, ValidImo));
        }

        [Fact]
        public void Create_WithInvalidETAandETD_ShouldThrow()
        {
            var eta = new ClockTime(DateTime.Now.AddDays(3));
            var etd = new ClockTime(DateTime.Now.AddDays(1));

            Assert.Throws<BusinessRuleValidationException>(() =>
                new VesselVisitNotification(ValidCode, eta, etd, 800, EmptyDocs, null, null, null, ValidImo));
        }

        [Fact]
        public void Create_WithNullDocuments_ShouldCreateEmptyCollection()
        {
            var vvn = new VesselVisitNotification(ValidCode, ValidETA, ValidETD, 900, null, null, null, null, ValidImo);

            Assert.NotNull(vvn.Documents);
            Assert.Empty(vvn.Documents.Pdfs);
        }

        [Fact]
        public void Submit_ShouldChangeStatusToSubmitted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Equal(VvnStatus.Submitted, vvn.Status.StatusValue);
            Assert.False(vvn.IsEditable);
            Assert.NotNull(vvn.SubmittedDate);
        }

        [Fact]
        public void Submit_Twice_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.Submit());
        }

        [Fact]
        public void MarkPending_ShouldChangeStatusAndStayEditable()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.MarkPending("Need documents");

            Assert.Equal(VvnStatus.PendingInformation, vvn.Status.StatusValue);
            Assert.True(vvn.IsEditable);
        }

        [Fact]
        public void MarkPending_WhenNotSubmitted_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.MarkPending("Invalid"));
        }

        [Fact]
        public void Withdraw_ShouldSetStatusToWithdrawn()
        {
            var vvn = CreateValidVVN();
            vvn.Withdraw();

            Assert.Equal(VvnStatus.Withdrawn, vvn.Status.StatusValue);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Withdraw_WhenAccepted_ShouldThrow()
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
        public void Accept_ShouldChangeStatusToAccepted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.Equal(VvnStatus.Accepted, vvn.Status.StatusValue);
            Assert.NotNull(vvn.AcceptenceDate);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Accept_WhenNotSubmitted_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Accept());
        }

        [Fact]
        public void FullLifecycle_ShouldFollowValidFlow()
        {
            var vvn = CreateValidVVN();

            vvn.Submit();
            vvn.MarkPending("Missing manifest");
            vvn.Withdraw();
            vvn.Resume();
            vvn.Submit();
            vvn.Accept();

            Assert.Equal(VvnStatus.Accepted, vvn.Status.StatusValue);
            Assert.NotNull(vvn.AcceptenceDate);
        }
        

        [Fact]
        public void UpdateMethods_ShouldModifyValues_WhenEditable()
        {
            var vvn = CreateValidVVN();
            var newETA = new ClockTime(DateTime.Now.AddDays(1));
            var newETD = new ClockTime(DateTime.Now.AddDays(2));
            var newDock = new DockCode("DK-0022");
            var newImo = new ImoNumber("IMO 7654329");

            vvn.UpdateEstimatedTimeArrival(newETA);
            vvn.UpdateEstimatedTimeDeparture(newETD);
            vvn.UpdateVolume(777);
            vvn.UpdateImoNumber(newImo);

            Assert.Equal(newETA, vvn.EstimatedTimeArrival);
            Assert.Equal(newETD, vvn.EstimatedTimeDeparture);
            Assert.Equal(777, vvn.Volume);
            Assert.Equal(newImo, vvn.VesselImo);
        }

        [Fact]
        public void UpdateVolume_WithNegative_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateVolume(-99));
        }

        [Fact]
        public void Update_WhenNotEditable_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateVolume(999));
            Assert.Throws<BusinessRuleValidationException>(() =>
                vvn.UpdateEstimatedTimeArrival(new ClockTime(DateTime.Now.AddDays(3))));
        }

        [Fact]
        public void UpdateCrewAndCargo_ShouldSetManifests_WhenEditable()
        {
            var vvn = CreateValidVVN();

            var crew = new CrewManifest(10, "Captain Nemo", null);

            // Criar um cargo manifest válido com todos os parâmetros necessários
            var entries = new List<CargoManifestEntry>();
            var code = "CM-0001";
            var type = CargoManifestType.Loading;
            var createdAt = DateTime.Now;
            var submittedBy = new Email("admin@port.com");

            var cargo = new CargoManifest(entries, code, type, createdAt, submittedBy);

            vvn.UpdateCrewManifest(crew);
            vvn.UpdateLoadingCargoManifest(cargo);
            vvn.UpdateUnloadingCargoManifest(cargo);

            Assert.Equal(crew, vvn.CrewManifest);
            Assert.Equal(cargo, vvn.LoadingCargoManifest);
            Assert.Equal(cargo, vvn.UnloadingCargoManifest);
        }

        [Fact]
        public void SetTasks_ShouldAssignListProperly()
        {
            var vvn = CreateValidVVN();
            var tasks = new List<EntityTask>
            {
                new EntityTask(new TaskCode(TaskType.ContainerHandling, 1), "Inspect vessel", TaskType.ContainerHandling),
                new EntityTask(new TaskCode(TaskType.YardTransport, 2), "Unload cargo", TaskType.YardTransport),
            };

            vvn.SetTasks(tasks);

            Assert.Equal(2, vvn.Tasks.Count);
            Assert.Equal(TaskStatus.Pending, tasks[0].Status);
        }

        [Fact]
        public void ToString_ShouldContainReadableInfo()
        {
            var vvn = CreateValidVVN();
            var str = vvn.ToString();

            Assert.Contains("VVN", str);
            Assert.Contains(vvn.Code.Code, str);
            Assert.Contains(vvn.Status.ToString(), str);
        }

        [Fact]
        public void Equals_ShouldReturnTrue_WhenCodesMatch()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000001"), ValidETA, ValidETD, 1000, EmptyDocs, null, null, null, ValidImo);

            Assert.True(vvn1.Equals(vvn2));
            Assert.Equal(vvn1.GetHashCode(), vvn2.GetHashCode());
        }

        [Fact]
        public void Equals_ShouldReturnFalse_WhenCodesDiffer()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000002"), ValidETA, ValidETD, 1000, EmptyDocs, null, null, null, ValidImo);

            Assert.False(vvn1.Equals(vvn2));
        }

        [Fact]
        public void IsEditable_ShouldBeFalse_WhenAccepted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void IsEditable_ShouldBeTrue_WhenPendingInformation()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.MarkPending("Waiting docs");

            Assert.True(vvn.IsEditable);
        }
    }
}
