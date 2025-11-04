using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

public class User : Entity<UserId>, IAggregateRoot
{
    public string IamId { get; private set; }
    public string Email { get; private set; }
    public string Name { get; private set; }
    public bool IsActive { get; set; }
    public Roles Role { get; set; }


    public User(string iamId, string email, string name, bool isActive, Roles role)
    {
        IamId = iamId;
        Email = email;
        Name = name;
        IsActive = isActive;
        Role = role;
    }

    public void UpdateRole(Roles newRole)
    {
        Role = newRole;
    }

    public void ToggleStatus()
    {
        IsActive = !IsActive;
    }

    public override bool Equals(object? obj)
    {
        if (obj == null || GetType() != obj.GetType())
            return false;

        User other = (User)obj;
        return Email.Equals(other.Email);
    }

    public override int GetHashCode()
    {
        return Email.GetHashCode();
    }
}