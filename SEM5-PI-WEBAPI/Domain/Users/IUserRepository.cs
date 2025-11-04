using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Users;

public interface IUserRepository : IRepository<User, UserId>
{
    Task<List<User>> GetAllNonAuthorizedAsync();
    Task<User?> GetByEmailAsync(string email);
}