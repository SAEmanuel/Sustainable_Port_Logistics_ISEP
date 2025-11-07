using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

public class User : Entity<UserId>, IAggregateRoot
{
    public string Auth0UserId { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public bool IsActive { get; set; }
    public Roles? Role { get; set; }
    public byte[]? Picture { get; set; }

    protected User() {}

    public User(string auth0UserId, string email, string name, byte[]? picture = null)
    {
        Id = new UserId(Guid.NewGuid());
        Auth0UserId = auth0UserId;
        Email = email;
        Name = name;
        Picture = picture;
        Role = null;
        IsActive = true;
    }

    public void UpdateRole(Roles newRole)
    {
        if (newRole == Role)
            throw new BusinessRuleValidationException("Cannot update Role to the same Role");

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