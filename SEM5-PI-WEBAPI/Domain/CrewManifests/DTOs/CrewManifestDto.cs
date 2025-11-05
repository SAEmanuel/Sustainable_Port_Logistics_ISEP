using SEM5_PI_WEBAPI.Domain.CrewMembers;

namespace SEM5_PI_WEBAPI.Domain.CrewManifests.DTOs;

public class CrewManifestDto
{
    public Guid Id { get; set; }
    public int TotalCrew { get; set; }
    public string CaptainName { get; set; }
    public List<CrewMemberDto>? CrewMembers { get; set; }


    public CrewManifestDto(Guid id, int totalCrew, string captainName, List<CrewMemberDto>? crewMembers)
    {
        Id = id;
        TotalCrew = totalCrew;
        CaptainName = captainName;
        CrewMembers = crewMembers;
    }
}