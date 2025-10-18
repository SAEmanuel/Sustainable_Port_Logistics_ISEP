using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.ValueObject
{
    public class EmailAddressTests
    {
        [Fact]
        public void CreateEmailAddress_WithValidFormat_ShouldSucceed()
        {
            const string validEmail = "user@example.com";

            var email = new EmailAddress(validEmail);

            Assert.Equal(validEmail.ToLower(), email.Address);
            Assert.Equal("user@example.com", email.ToString());
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData(null)]
        [InlineData("userexample.com")]
        [InlineData("user@@example.com")]
        [InlineData("user@.com")]
        [InlineData("user@domain")]
        public void CreateEmailAddress_WithInvalidFormat_ShouldThrowException(string invalidEmail)
        {
            Assert.Throws<BusinessRuleValidationException>(() => new EmailAddress(invalidEmail));
        }

        [Fact]
        public void TwoEmails_WithSameValue_ShouldBeEqual()
        {
            var email1 = new EmailAddress("TEST@Example.com");
            var email2 = new EmailAddress("test@example.com");

            Assert.Equal(email1, email2);
            Assert.True(email1.Equals(email2));
            Assert.Equal(email1.GetHashCode(), email2.GetHashCode());
        }

        [Fact]
        public void TwoEmails_WithDifferentValue_ShouldNotBeEqual()
        {
            var email1 = new EmailAddress("user1@example.com");
            var email2 = new EmailAddress("user2@example.com");

            
            Assert.NotEqual(email1, email2);
        }

        [Fact]
        public void ToString_ShouldReturnNormalizedEmail()
        {
            
            var email = new EmailAddress("USER@Example.COM");

            var result = email.ToString();

            Assert.Equal("user@example.com", result);
        }

        [Fact]
        public void ImplicitConversion_ToString_ShouldReturnAddress()
        {
            var email = new EmailAddress("user@example.com");

            string result = email;

            Assert.Equal("user@example.com", result);
        }

        [Fact]
        public void ExplicitConversion_FromString_ShouldCreateEmail()
        {
            const string value = "user@example.com";

            var email = (EmailAddress)value;

            Assert.Equal(value, email.Address);
        }

        [Fact]
        public void Should_BeImmutable()
        {
            var email = new EmailAddress("immutable@example.com");

            var type = typeof(EmailAddress).GetProperty("Address");

            Assert.False(type.CanWrite, "EmailAddress must be immutable (no public setter)");
        }
    }
}
