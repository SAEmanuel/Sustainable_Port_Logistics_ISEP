using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.Users;

public class UserRepository : BaseRepository<User, UserId>, IUserRepository
{
    private readonly DbSet<User> _users;
    private readonly DddSample1DbContext _context;

    public UserRepository(DddSample1DbContext context) : base(context.Users)
    {
        _users = context.Users;
        _context = context;
    }
}