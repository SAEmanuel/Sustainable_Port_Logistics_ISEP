namespace SEM5_PI_WEBAPI.Tests.ValueObject;

using SEM5_PI_WEBAPI.Domain.ValueObjects;
using Xunit;

public class PhoneNumberTests
{
    [Fact]
    public void CreatePhoneNumber_ValidNumber_ShouldInitialize()
    {
        var validNumber = "+351914671555";
        var phoneNumber = new PhoneNumber(validNumber);

        Assert.Equal(validNumber, phoneNumber.Number);
        Assert.Equal(validNumber, phoneNumber.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreatePhoneNumber_EmptyOrWhiteSpace_ShouldThrow(string invalidNumber)
    {
        Assert.Throws<SEM5_PI_WEBAPI.Domain.Shared.BusinessRuleValidationException>(() => new PhoneNumber(invalidNumber!));
    }

    [Theory]
    [InlineData("1234")]          
    [InlineData("+0")]            
    [InlineData("+351-4671555")]   
    [InlineData("++3514671555")]  
    public void CreatePhoneNumber_InvalidFormat_ShouldThrow(string invalidNumber)
    {
        Assert.Throws<SEM5_PI_WEBAPI.Domain.Shared.BusinessRuleValidationException>(() => new PhoneNumber(invalidNumber));
    }

    [Fact]
    public void Equals_SameNumber_ShouldReturnTrue()
    {
        var num1 = new PhoneNumber("+123456789");
        var num2 = new PhoneNumber("+123456789");

        Assert.True(num1.Equals(num2));
        Assert.Equal(num1.GetHashCode(), num2.GetHashCode());
    }

    [Fact]
    public void Equals_DifferentNumber_ShouldReturnFalse()
    {
        var num1 = new PhoneNumber("+123456789");
        var num2 = new PhoneNumber("+987654321");

        Assert.False(num1.Equals(num2));
    }
}
