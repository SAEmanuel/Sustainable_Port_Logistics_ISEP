using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Domain.CrewMembers;

public class CrewMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public CrewRole Role { get; set; }
    public Nationality Nationality { get; set; }
    public string CitizenId { get; set; }


    public CrewMemberDto(Guid id, string name, CrewRole role, Nationality nationality, string citizenId)
    {
        Id = id;
        Name = name;
        Role = role;
        Nationality = nationality;
        CitizenId = citizenId;
    }
}