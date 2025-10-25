namespace SEM5_PI_WEBAPI.Tests.ValueObject;

using SEM5_PI_WEBAPI.Domain.StaffMembers;
using Xunit;

public class EmailTests
{
    [Fact]
    public void CreateEmail_ValidFormat_ShouldSucceed()
    {
        var emailAddress = "user@example.com";
        var email = new Email(emailAddress);
        Assert.Equal(emailAddress, email.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateEmail_EmptyOrNull_ShouldThrow(string invalidEmail)
    {
        Assert.Throws<SEM5_PI_WEBAPI.Domain.Shared.BusinessRuleValidationException>(() => new Email(invalidEmail));
    }

    [Theory]
    [InlineData("invalidEmail")]
    [InlineData("useratexample.com")]
    [InlineData("user@.com")]
    [InlineData("user@com")]
    public void CreateEmail_InvalidFormat_ShouldThrow(string invalidEmail)
    {
        Assert.Throws<SEM5_PI_WEBAPI.Domain.Shared.BusinessRuleValidationException>(() => new Email(invalidEmail));
    }

    [Fact]
    public void Equals_SameAddressDifferentCase_ShouldBeEqual()
    {
        var email1 = new Email("Test@Example.com");
        var email2 = new Email("test@example.com");

        Assert.True(email1.Equals(email2));
        Assert.Equal(email1.GetHashCode(), email2.GetHashCode());
    }

    [Fact]
    public void ToString_ShouldReturnEmailAddress()
    {
        var emailAddress = "abc@xyz.com";
        var email = new Email(emailAddress);
        Assert.Equal(emailAddress, email.ToString());
    }
}
