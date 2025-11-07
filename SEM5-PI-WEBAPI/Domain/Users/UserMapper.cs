using SEM5_PI_WEBAPI.Domain.Users.DTOs;

namespace SEM5_PI_WEBAPI.Domain.Users;

public static class UserMapper
{
    public static UserDto ToDto(User user)
    {
        return new UserDto(
            user.Id.AsGuid(),
            user.Auth0UserId,
            user.Email,
            user.Name,
            user.IsActive,
            user.Eliminated,
            user.Role,
            user.Picture
        );
    }

    public static List<UserDto> ToDtoList(List<User> users)
    {
        return users.Select(ToDto).ToList();
    }
}