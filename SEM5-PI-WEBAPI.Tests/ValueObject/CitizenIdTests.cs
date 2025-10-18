using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Shared;
using Xunit;

namespace SEM5_PI_WEBAPI.Tests.ValueObject
{
    public class CitizenIdTests
    {
        [Fact]
        public void CreateCitizenId_ValidPassportNumber_ShouldInitialize()
        {
            var validPassport = "A123456";

            var citizenId = new CitizenId(validPassport);

            Assert.Equal(validPassport.ToUpperInvariant(), citizenId.PassportNumber);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void CreateCitizenId_EmptyOrWhitespace_ShouldThrow(string? invalidPassport)
        {
            var ex = Assert.Throws<BusinessRuleValidationException>(() =>
                new CitizenId(invalidPassport!));

            Assert.Equal("Passport number cannot be empty.", ex.Message);
        }

        [Theory]
        [InlineData("123")]             // Too short
        [InlineData("1234567890")]      // Too long
        [InlineData("ABC@123")]         // Invalid symbol
        [InlineData("ABCDE!12")]        // Invalid character
        public void CreateCitizenId_InvalidFormat_ShouldThrow(string invalidPassport)
        {
            var ex = Assert.Throws<BusinessRuleValidationException>(() =>
                new CitizenId(invalidPassport));

            Assert.Contains("Invalid passport number format", ex.Message);
        }

        [Fact]
        public void ToString_ShouldReturnPassportNumber()
        {
            var passport = "ABC1234";
            var citizenId = new CitizenId(passport);

            Assert.Equal(passport.ToUpperInvariant(), citizenId.ToString());
        }

        [Fact]
        public void Equals_ShouldReturnTrue_WhenPassportNumbersMatch()
        {
            var id1 = new CitizenId("AB1234C");
            var id2 = new CitizenId("ab1234c");

            Assert.True(id1.Equals(id2));
            Assert.Equal(id1.GetHashCode(), id2.GetHashCode());
        }

        [Fact]
        public void Equals_ShouldReturnFalse_WhenPassportNumbersDiffer()
        {
            var id1 = new CitizenId("AA1111");
            var id2 = new CitizenId("BB2222");

            Assert.False(id1.Equals(id2));
        }
    }
}
