using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string IamId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public bool IsActive { get; set; }
    public Roles Role { get; set; }

    public UserDto(Guid id, string iamId, string email, string name, bool isActive, Roles role)
    {
        Id = id;
        IamId = iamId;
        Email = email;
        Name = name;
        IsActive = isActive;
        Role = role;
    }
}