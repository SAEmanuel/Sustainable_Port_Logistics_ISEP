namespace SEM5_PI_WEBAPI.Tests.ValueObject;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;
using Xunit;

public class CitizenIdTests
{
    [Fact]
    public void CreateCitizenId_ValidPassportNumber_ShouldInitialize()
    {
        var validPassport = "A123456";
        var citizenId = new CitizenId(validPassport);

        Assert.Equal(validPassport, citizenId.PassportNumber);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCitizenId_EmptyOrWhitespace_ShouldThrow(string? invalidPassport)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CitizenId(invalidPassport!));
    }

    [Theory]
    [InlineData("123")]           
    [InlineData("1234567890")]    
    [InlineData("ABC@123")]       
    [InlineData("ABCDE!12")]      
    public void CreateCitizenId_InvalidFormat_ShouldThrow(string invalidPassport)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CitizenId(invalidPassport));
    }

    [Fact]
    public void ToString_ShouldReturnPassportNumber()
    {
        var passport = "ABC1234";
        var citizenId = new CitizenId(passport);

        Assert.Equal(passport, citizenId.ToString());
    }
}