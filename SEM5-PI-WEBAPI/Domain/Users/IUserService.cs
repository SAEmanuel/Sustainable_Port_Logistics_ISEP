using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

public interface IUserService
{
    Task<UserDto> ToggleAsync(UserId id);
    Task<UserDto> ChangeRoleAsync(UserId id, Roles role);
    Task<UserDto> GetByIdAsync(UserId id);
    Task<UserDto> GetByEmailAsync(string email);
    Task<List<UserDto>> GetAllNonAuthorizedAsync();
    Task<List<UserDto>> GetAllAsync();
}