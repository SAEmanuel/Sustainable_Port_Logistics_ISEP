using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Domain.CrewMembers;

public class CreatingCrewMemberDto
{
    public string Name { get; set; }
    public CrewRole Role { get; set; }
    public Nationality Nationality { get; set; }
    public string CitizenId { get; set; }


    public CreatingCrewMemberDto(string name, CrewRole role, Nationality nationality, string citizenId)
    {
        Name = name;
        Role = role;
        Nationality = nationality;
        CitizenId = citizenId;
    }
}