using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CrewMembers;

public class CrewMember : Entity<CrewMemberId>
{
    private static readonly int MinLength = 2;
    private static readonly int MaxLength = 100;

    public string Name { get; private set; }
    public CrewRole Role { get; private set; }
    public Nationality Nationality { get; private set; }
    public CitizenId CitizenId { get; private set; }

    public CrewMember(string name, CrewRole role, Nationality nationality, CitizenId citizenId)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleValidationException("Name cannot be empty or whitespace.");

        if (name.Length < MinLength || name.Length > MaxLength)
            throw new BusinessRuleValidationException("Name length must be between 2 and 100 characters.");

        Name = name;
        Role = role;
        Nationality = nationality;
        CitizenId = citizenId;
        Id = new CrewMemberId(Guid.NewGuid());
    }
}