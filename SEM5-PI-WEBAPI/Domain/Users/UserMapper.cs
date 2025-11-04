using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

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

public class UserMapper
{
    public static UserDto ToDto(User user)
    {
        return new UserDto(
            user.Id.AsGuid(),
            user.IamId,
            user.Email,
            user.Name,
            user.IsActive,
            user.Role
        );
    }

    public static List<UserDto> ToDtoList(List<User> users)
    {
        return users.Select(u => ToDto(u)).ToList();
    }
}