using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users.DTOs;

public class CreatingUserDto
{
    public string Auth0UserId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
    public Roles? Role { get; set; }
    public string? Picture { get; set; }

    [JsonConstructor]
    public CreatingUserDto(string auth0UserId, string name, string email, bool isActive, Roles? role, string? picture)
    {
        Auth0UserId = auth0UserId;
        Name = name;
        Email = email;
        IsActive = isActive;
        Role = role;
        Picture = picture;
    }
}