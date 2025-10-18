using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class CitizenId : IValueObject
{
    private static readonly Regex PassportPattern = new(@"^[A-Za-z0-9]{6,9}$", RegexOptions.Compiled);

    public string PassportNumber { get; private set; }

    private CitizenId() { }

    public CitizenId(string passportNumber)
    {
        if (string.IsNullOrWhiteSpace(passportNumber))
            throw new BusinessRuleValidationException("Passport number cannot be empty.");

        if (!PassportPattern.IsMatch(passportNumber))
            throw new BusinessRuleValidationException($"Invalid passport number format: {passportNumber}");

        PassportNumber = passportNumber.Trim().ToUpperInvariant();
    }

    public override string ToString() => PassportNumber;

    public override bool Equals(object? obj)
    {
        if (obj is not CitizenId other) return false;
        return PassportNumber == other.PassportNumber;
    }

    public override int GetHashCode() => PassportNumber.GetHashCode(StringComparison.Ordinal);
}