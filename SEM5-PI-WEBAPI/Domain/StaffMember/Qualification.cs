using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMember;

public class Qualification : Entity<QualificationId>, IAggregateRoot
{
    public string? Code { get; private set; }
    public string Name { get; private set; }


    public Qualification(string name)
    {
        Name = name;
    }

    public void ChangeName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Name cannot be empty");
        Name = newName;
    }

    public override bool Equals(object? obj) =>
        obj is Qualification other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();


    public override string ToString() => $"{Code}: {Name}";
}