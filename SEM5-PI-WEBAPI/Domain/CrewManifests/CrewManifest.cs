using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CrewManifests;

public class CrewManifest : Entity<CrewManifestId>
{
    public int TotalCrew { get; set; }
    [MaxLength(30)] public string CaptainName { get; set; }
    private List<CrewMember> CrewMembers { get; set; }


    protected CrewManifest()
    {
    }

    public CrewManifest(int totalCrew, string captainName, List<CrewMember> crewMembers)
    {
        TotalCrew = totalCrew;
        CaptainName = captainName;
        CrewMembers = crewMembers;
    }
}