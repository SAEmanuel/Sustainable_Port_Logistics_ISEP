using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Tests.Domain;

public class CrewMemberTests
{
    private readonly CrewRole _validRole = CrewRole.Captain;
    private readonly Nationality _validNationality = Nationality.Portugal;
    private readonly CitizenId _validCitizenId = new ("A78B776");

    [Fact]
    public void CreateCrewMember_ValidData_ShouldInitializeProperties()
    {
        var member = new CrewMember("John Doe", _validRole, _validNationality, _validCitizenId);

        Assert.NotNull(member.Id);
        Assert.Equal("John Doe", member.Name);
        Assert.Equal(_validRole, member.Role);
        Assert.Equal(_validNationality, member.Nationality);
        Assert.Equal(_validCitizenId, member.CitizenId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCrewMember_EmptyOrWhitespaceName_ShouldThrow(string invalidName)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CrewMember(invalidName, _validRole, _validNationality, _validCitizenId));
    }

    [Theory]
    [InlineData("A")] 
    [InlineData("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")]
    public void CreateCrewMember_NameLengthOutOfBounds_ShouldThrow(string invalidName)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CrewMember(invalidName, _validRole, _validNationality, _validCitizenId));
    }
}