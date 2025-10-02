using System.Text.RegularExpressions;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class Email
{
    private static readonly Regex EmailRegex = new Regex(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string Address { get; private set; } 

    protected Email() { } 

    public Email(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Email cannot be empty.");

        if (!EmailRegex.IsMatch(address))
            throw new ArgumentException("Invalid email format.");

        Address = address;
    }

    public override bool Equals(object? obj) =>
        obj is Email other && Address.Equals(other.Address, StringComparison.OrdinalIgnoreCase);

    public override int GetHashCode() => Address.ToLowerInvariant().GetHashCode();

    public override string ToString() => Address;
}