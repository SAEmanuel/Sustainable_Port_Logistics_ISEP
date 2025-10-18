using System;
using System.Linq;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using Xunit;

namespace SEM5_PI_WEBAPI.Tests.Domain
{
    public class ShippingAgentRepresentativeTests
    {
        private readonly Nationality ValidNationality = Nationality.Portugal;
        private readonly CitizenId ValidCitizenId = new ("A78B776");
        private readonly ShippingOrganizationCode ValidSAO = new ShippingOrganizationCode("1234567890");
        private readonly PhoneNumber ValidPhone = new PhoneNumber("+351914671555");

        private readonly SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status Activated = SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.activated;

        private readonly SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status Deactivated = SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.Status.deactivated;

        private const string ValidName = "John Doe";
        private const string ValidEmail = "john.doe@example.com";

        [Fact]
        public void CreateShippingAgentRepresentative_WithValidData_ShouldInitializeCorrectly()
        {
            var rep = new ShippingAgentRepresentative(
                ValidName,
                ValidCitizenId,
                ValidNationality,
                ValidEmail,
                ValidPhone,
                Activated,
                ValidSAO);

            Assert.NotNull(rep.Id);
            Assert.Equal(ValidName, rep.Name);
            Assert.Equal(ValidCitizenId, rep.CitizenId);
            Assert.Equal(ValidNationality, rep.Nationality);
            Assert.Equal(ValidEmail, rep.Email);
            Assert.Equal(ValidPhone, rep.PhoneNumber);
            Assert.Equal(Activated, rep.Status);
            Assert.Equal(ValidSAO, rep.SAO);
            Assert.Empty(rep.Notifs);
        }

        [Theory]
        [InlineData("invalid-email")]
        [InlineData("missingatsign.com")]
        [InlineData("missingdomain@")]
        [InlineData("john@doe@site.com")]
        public void CreateShippingAgentRepresentative_WithInvalidEmail_ShouldThrow(string invalidEmail)
        {
            Assert.Throws<BusinessRuleValidationException>(() =>
                new ShippingAgentRepresentative(
                    ValidName,
                    ValidCitizenId,
                    ValidNationality,
                    invalidEmail,
                    ValidPhone,
                    Activated,
                    ValidSAO)
            );
        }

        [Fact]
        public void UpdateEmail_WithValidEmail_ShouldChangeEmail()
        {
            var rep = CreateValidRepresentative();

            rep.UpdateEmail("new.email@example.com");

            Assert.Equal("new.email@example.com", rep.Email);
        }

        [Theory]
        [InlineData("invalidemail")]
        [InlineData("")]
        [InlineData("  ")]
        public void UpdateEmail_WithInvalidEmail_ShouldThrow(string invalidEmail)
        {
            var rep = CreateValidRepresentative();

            Assert.Throws<BusinessRuleValidationException>(() => rep.UpdateEmail(invalidEmail));
        }

        [Fact]
        public void UpdatePhoneNumber_ShouldChangePhoneNumber()
        {
            var rep = CreateValidRepresentative();

            var newPhone = new PhoneNumber("+351987654321");

            rep.UpdatePhoneNumber(newPhone);

            Assert.Equal("+351987654321", rep.PhoneNumber.Number);
        }

        [Fact]
        public void UpdateStatus_WithValidString_ShouldChangeStatus()
        {
            var rep = CreateValidRepresentative();

            rep.UpdateStatus("deactivated");

            Assert.Equal(Deactivated, rep.Status);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        public void UpdateStatus_WithEmptyOrNull_ShouldThrow(string? invalidStatus)
        {
            var rep = CreateValidRepresentative();

            Assert.Throws<ArgumentException>(() => rep.UpdateStatus(invalidStatus!));
        }

        [Fact]
        public void UpdateStatus_WithInvalidValue_ShouldThrow()
        {
            var rep = CreateValidRepresentative();

            var ex = Assert.Throws<ArgumentException>(() => rep.UpdateStatus("unknown"));
            Assert.Contains("Invalid status value", ex.Message);
        }

        [Fact]
        public void AddNotification_WithValidNotif_ShouldAddToList()
        {
            var rep = CreateValidRepresentative();
            var notif = new VvnCode("2025-THPA-000001"); // ✅ Correct format

            rep.AddNotification(notif);

            Assert.Single(rep.Notifs);
            Assert.Equal("2025-THPA-000001", rep.Notifs.First().Code);
}


        [Fact]
        public void AddNotification_WithDuplicateNotif_ShouldThrow()
        {
            var rep = CreateValidRepresentative();
            var notif = new VvnCode("2025-THPA-000001");

            rep.AddNotification(notif);

            var ex = Assert.Throws<BusinessRuleValidationException>(() => rep.AddNotification(notif));
            Assert.Contains("already exists", ex.Message);
        }

        [Fact]
        public void AddNotification_WithNullNotif_ShouldThrow()
        {
            var rep = CreateValidRepresentative();

            Assert.Throws<BusinessRuleValidationException>(() => rep.AddNotification(null!));
        }

        [Fact]
        public void Equals_ShouldReturnTrue_ForSameId()
        {
            var rep1 = CreateValidRepresentative();
            var rep2 = CreateValidRepresentative();

            // Set same ID via reflection
            typeof(Entity<ShippingAgentRepresentativeId>)
                .GetProperty("Id")!
                .SetValue(rep2, rep1.Id);

            Assert.True(rep1.Equals(rep2));
            Assert.Equal(rep1.GetHashCode(), rep2.GetHashCode());
        }

        private ShippingAgentRepresentative CreateValidRepresentative()
        {
            return new ShippingAgentRepresentative(
                ValidName,
                ValidCitizenId,
                ValidNationality,
                ValidEmail,
                ValidPhone,
                Activated,
                ValidSAO);
        }
    }
}
