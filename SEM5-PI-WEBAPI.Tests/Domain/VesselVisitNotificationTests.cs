using System;
using System.Collections.Generic;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using Xunit;

namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class VesselVisitNotificationTests
    {
        private VvnCode ValidCode => new("2025", "000001");
        private ClockTime ValidETA => new(DateTime.Now.AddDays(1));
        private ClockTime ValidETD => new(DateTime.Now.AddDays(2));
        private ImoNumber ValidImo => new("IMO 1234567");

        private List<EntityDock> ValidDocks => new() { BuildValidDock("DK-0001", "Dock 1") };
        private static PdfDocumentCollection EmptyDocuments => new();
        

        [Fact]
        public void CreateVesselVisitNotification_WithValidData_ShouldSucceed()
        {
            var vvn = CreateValidVVN();

            Assert.Equal(VvnStatus.InProgress, vvn.Status);
            Assert.Equal("2025-THPA-000001", vvn.Code.Code);
            Assert.Equal(1200, vvn.Volume);
            Assert.NotNull(vvn.ListDocks);
            Assert.True(vvn.IsEditable);
            Assert.Null(vvn.ActualTimeArrival);
            Assert.Null(vvn.ActualTimeDeparture);
            Assert.Null(vvn.AcceptenceDate);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithNullDocks_ShouldNotFail()
        {
            var vvn = new VesselVisitNotification(
                ValidCode, ValidETA, ValidETD, 500,
                EmptyDocuments, null, null, null, null, ValidImo
            );

            Assert.NotNull(vvn.ListDocks);
            Assert.Empty(vvn.ListDocks);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithEmptyDocuments_ShouldDefaultToEmptyCollection()
        {
            var vvn = new VesselVisitNotification(
                ValidCode, ValidETA, ValidETD, 400,
                null, ValidDocks, null, null, null, ValidImo
            );

            Assert.NotNull(vvn.Documents);
            Assert.Empty(vvn.Documents.Pdfs);
        }

        [Fact]
        public void CreateVesselVisitNotification_WithNegativeVolume_ShouldThrow()
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new VesselVisitNotification(
                    ValidCode, ValidETA, ValidETD, -100,
                    EmptyDocuments, ValidDocks, null, null, null, ValidImo
                ));
        }

        [Fact]
        public void Submit_ShouldChangeStatusToSubmitted_WhenInProgress()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();

            Assert.Equal(VvnStatus.Submitted, vvn.Status);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Submit_ShouldThrow_WhenNotInProgress()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Submit());
        }

        [Fact]
        public void MarkPending_ShouldChangeStatusToPendingInformation_WhenSubmitted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.MarkPending();

            Assert.Equal(VvnStatus.PendingInformation, vvn.Status);
            Assert.True(vvn.IsEditable);
        }

        [Fact]
        public void Withdraw_ShouldChangeStatusToWithdrawn_WhenInProgress()
        {
            var vvn = CreateValidVVN();
            vvn.Withdraw();

            Assert.Equal(VvnStatus.Withdrawn, vvn.Status);
            Assert.False(vvn.IsEditable);
        }

        [Fact]
        public void Withdraw_ShouldThrow_WhenAlreadyAccepted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.Throws<BusinessRuleValidationException>(() => vvn.Withdraw());
        }

        [Fact]
        public void Resume_ShouldChangeStatusToInProgress_WhenWithdrawn()
        {
            var vvn = CreateValidVVN();
            vvn.Withdraw();
            vvn.Resume();

            Assert.Equal(VvnStatus.InProgress, vvn.Status);
            Assert.True(vvn.IsEditable);
        }

        [Fact]
        public void Resume_ShouldThrow_WhenNotWithdrawn()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Resume());
        }

        [Fact]
        public void Accept_ShouldChangeStatusToAccepted_WhenSubmitted()
        {
            var vvn = CreateValidVVN();
            vvn.Submit();
            vvn.Accept();

            Assert.Equal(VvnStatus.Accepted, vvn.Status);
            Assert.NotNull(vvn.AcceptenceDate);
            Assert.False(vvn.IsEditable);
            Assert.False(string.IsNullOrWhiteSpace(vvn.ToString()));
        }

        [Fact]
        public void Accept_ShouldThrow_WhenNotSubmitted()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.Accept());
        }

        [Fact]
        public void FullLifecycle_ShouldTransitionThroughAllValidStates()
        {
            var vvn = CreateValidVVN();

            // InProgress → Submitted
            vvn.Submit();
            Assert.Equal(VvnStatus.Submitted, vvn.Status);

            // Submitted → Pending
            vvn.MarkPending();
            Assert.Equal(VvnStatus.PendingInformation, vvn.Status);

            // Pending → Withdrawn
            vvn.Withdraw();
            Assert.Equal(VvnStatus.Withdrawn, vvn.Status);

            // Withdrawn → Resume → InProgress
            vvn.Resume();
            Assert.Equal(VvnStatus.InProgress, vvn.Status);

            // InProgress → Submit → Accept
            vvn.Submit();
            vvn.Accept();
            Assert.Equal(VvnStatus.Accepted, vvn.Status);
        }
        

        [Fact]
        public void UpdateMethods_ShouldModifyFieldsCorrectly()
        {
            var vvn = CreateValidVVN();

            var newETA = new ClockTime(DateTime.Now.AddDays(5));
            var newETD = new ClockTime(DateTime.Now.AddDays(6));
            var newDocks = new List<EntityDock> { BuildValidDock("DK-0002", "Dock 2") };

            vvn.UpdateEstimatedTimeArrival(newETA);
            vvn.UpdateEstimatedTimeDeparture(newETD);
            vvn.UpdateVolume(999);
            vvn.UpdateListDocks(newDocks);

            Assert.Equal(newETA, vvn.EstimatedTimeArrival);
            Assert.Equal(newETD, vvn.EstimatedTimeDeparture);
            Assert.Equal(999, vvn.Volume);
            Assert.Equal("DK-0002", vvn.ListDocks.First().Code.Value);
        }

        [Fact]
        public void UpdateVolume_WithNegativeValue_ShouldThrow()
        {
            var vvn = CreateValidVVN();
            Assert.Throws<BusinessRuleValidationException>(() => vvn.UpdateVolume(-10));
        }
        

        [Fact]
        public void Equals_ShouldReturnTrue_ForSameCode()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000001"),
                ValidETA, ValidETD, 500, EmptyDocuments, ValidDocks, null, null, null, ValidImo
            );

            Assert.True(vvn1.Equals(vvn2));
            Assert.Equal(vvn1.GetHashCode(), vvn2.GetHashCode());
        }

        [Fact]
        public void Equals_ShouldReturnFalse_ForDifferentCode()
        {
            var vvn1 = CreateValidVVN();
            var vvn2 = new VesselVisitNotification(
                new VvnCode("2025", "000002"),
                ValidETA, ValidETD, 500, EmptyDocuments, ValidDocks, null, null, null, ValidImo
            );

            Assert.False(vvn1.Equals(vvn2));
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
            return new EntityDock(new DockCode(code), name, 12.0d, 350.0d, 50.0d, vesselTypes);
        }
    }
}
