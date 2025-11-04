using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

public class UserFactory
{
    public static User CreateUser(
        string iamId,
        string email,
        string name,
        bool isActive,
        Roles role)
    {
        return new User(
            iamId,
            email,
            name,
            isActive,
            role
        );
    }
}