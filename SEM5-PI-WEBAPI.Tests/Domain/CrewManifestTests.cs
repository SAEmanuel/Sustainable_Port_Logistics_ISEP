using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;


namespace SEM5_PI_WEBAPI.Tests.Domain;

public class CrewManifestTests
{
    private readonly List<CrewMember> _dummyCrewMembers = new List<CrewMember>
    {
        new ("Alice", CrewRole.Cook, Nationality.Qatar, new CitizenId("12345AA")),
        new ("Bob", CrewRole.EngineCadet, Nationality.Angola, new CitizenId("67890BB"))
    };

    [Fact]
    public void CreateCrewManifest_ValidData_ShouldInitialize()
    {
        int totalCrew = 2;
        string captainName = "Captain Nemo";

        var crewManifest = new CrewManifest(totalCrew, captainName, _dummyCrewMembers);

        Assert.NotNull(crewManifest.Id);
        Assert.Equal(totalCrew, crewManifest.TotalCrew);
        Assert.Equal(captainName, crewManifest.CaptainName);
        Assert.Equal(_dummyCrewMembers, crewManifest.CrewMembers);
    }

    [Fact]
    public void CreateCrewManifest_NegativeTotalCrew_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CrewManifest(-1, "Captain Nemo", _dummyCrewMembers));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("    ")]
    public void CreateCrewManifest_EmptyOrWhitespaceCaptainName_ShouldThrow(string invalidName)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CrewManifest(1, invalidName, _dummyCrewMembers));
    }

    [Theory]
    [InlineData("A")]  
    [InlineData("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")] 
    public void CreateCrewManifest_CaptainNameLengthOutOfBounds_ShouldThrow(string invalidName)
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new CrewManifest(1, invalidName, _dummyCrewMembers));
    }
}