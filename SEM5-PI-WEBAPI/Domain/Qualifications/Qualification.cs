using System.ComponentModel.DataAnnotations;
using Microsoft.IdentityModel.Tokens;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Qualifications;

public class Qualification : Entity<QualificationId>, IAggregateRoot
{   
    [MaxLength(15)]
    public string Code { get; set; }
    [MaxLength(150)]
    public string Name { get; set; }


    public Qualification(string name)
    {
        if (string.IsNullOrEmpty(name))
            throw new BusinessRuleValidationException("Name cannot be empty!");
        Name = name;
        Code = "";
        Id = new QualificationId(Guid.NewGuid());
    }

    public void UpdateName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new BusinessRuleValidationException("Name cannot be empty!");
        Name = newName;
    }
    
    public void UpdateCode(string code)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(code, @"^[A-Z]{3}-\d{3}$"))
            throw new BusinessRuleValidationException("Invalid Qualification code format. Expected format: XXX-000 (3 letters followed by a hyphen and 3 digits).");
    
        Code = code;
    }

    public override bool Equals(object? obj) =>
        obj is Qualification other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();


    public override string ToString() => $"{Code}: {Name}";
}