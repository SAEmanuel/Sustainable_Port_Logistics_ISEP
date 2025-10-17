using System.Text.RegularExpressions;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

public class CitizenId : IValueObject
{
    private static readonly Regex PassportPattern = new(@"^[A-Za-z0-9]{6,9}$");

    public string PassportNumber { get; private set; }

    public CitizenId(string passportNumber)
    {
        if (string.IsNullOrWhiteSpace(passportNumber))
            throw new BusinessRuleValidationException("Passport number cannot be empty.");

        if (!PassportPattern.IsMatch(passportNumber))
            throw new BusinessRuleValidationException("Invalid passport number format.");

        PassportNumber = passportNumber;
    }

    public override string ToString()
    {
        return PassportNumber;
    }
}