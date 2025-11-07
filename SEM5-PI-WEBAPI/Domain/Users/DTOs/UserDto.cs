using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users.DTOs;

public class UserDto
{
    public Guid Id { get; private set; }
    public string Auth0UserId { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public bool IsActive { get; private set; }
    public Roles? Role { get; private set; }
    public string? Picture { get; private set; } 

    public UserDto(Guid id, string auth0UserId, string email, string name, bool isActive, Roles? role, byte[]? pictureBytes)
    {
        Id = id;
        Auth0UserId = auth0UserId;
        Name = name;
        Email = email;
        IsActive = isActive;
        Role = role;
        
        Picture = pictureBytes != null 
            ? $"data:image/jpeg;base64,{Convert.ToBase64String(pictureBytes)}"
            : null;
    }
}