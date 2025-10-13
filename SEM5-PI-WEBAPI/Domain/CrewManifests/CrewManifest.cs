using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CrewManifests;

public class CrewManifest : Entity<CrewManifestId>
{
    private static readonly int MinLength = 2;
    private static readonly int MaxLength = 100;
    
    
    public int TotalCrew { get; set; }
    public string CaptainName { get; set; }
    public List<CrewMember>? CrewMembers { get; set; }


    protected CrewManifest()
    {
    }

    public CrewManifest(int totalCrew, string captainName, List<CrewMember>? crewMembers)
    {
        if (totalCrew < 0)
            throw new BusinessRuleValidationException("Total crew cannot be negative.");

        if (string.IsNullOrWhiteSpace(captainName))
            throw new BusinessRuleValidationException("Captain name cannot be empty or whitespace.");

        if (captainName.Length < MinLength || captainName.Length > MaxLength)
            throw new BusinessRuleValidationException($"Captain name length must be between {MinLength} and {MaxLength} characters.");

        TotalCrew = totalCrew;
        CaptainName = captainName;
        CrewMembers = crewMembers;
        Id = new CrewManifestId(Guid.NewGuid());
    }

}