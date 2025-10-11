using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class VvnCode : IValueObject
{
    private static readonly Regex Pattern = new(@"^\d{4}-[A-Z]{2,8}-\d{6}$", RegexOptions.Compiled);
    private const string PortCode = "THPA";
    private const int SequenceNumberLength = 6;
    private const int YearNumberLength = 4;

    public string Code { get; private set; }
    public int SequenceNumber { get; private set; }
    public int YearNumber { get; private set; }

    private VvnCode() { } 

    public VvnCode(string year, string nextSequence)
    {
        ValidateYear(year);
        ValidateSequence(nextSequence);

        string code = CreateCodeWithParts(year, nextSequence);

        if (!Pattern.IsMatch(code)) throw new BusinessRuleValidationException("Invalid VVN code. Expected format: {YEAR}-{PORT_CODE}-{SEQUENTIAL_NUMBER}, e.g. 2025-PTLEI-000001.");

        Code = code;
        SequenceNumber = int.Parse(nextSequence);
        YearNumber = int.Parse(year);
    }
    
    private void ValidateSequence(string nextSequence)
    {
        if (string.IsNullOrWhiteSpace(nextSequence))
            throw new BusinessRuleValidationException("Invalid SEQUENCE for VVN Code. Cannot be null or empty.");

        if (!nextSequence.All(char.IsDigit))
            throw new BusinessRuleValidationException("Invalid SEQUENCE for VVN Code. Must contain only digits.");

        if (nextSequence.Length != SequenceNumberLength)
            throw new BusinessRuleValidationException($"Invalid SEQUENCE for VVN Code. Must contain {SequenceNumberLength} digits.");
    }

    private void ValidateYear(string year)
    {
        if (string.IsNullOrWhiteSpace(year))
            throw new BusinessRuleValidationException("Invalid YEAR for VVN Code. Cannot be null or empty.");

        if (!year.All(char.IsDigit))
            throw new BusinessRuleValidationException("Invalid YEAR for VVN Code. Must contain only digits.");

        if (year.Length != YearNumberLength)
            throw new BusinessRuleValidationException($"Invalid YEAR for VVN Code. Must contain {YearNumberLength} digits.");

        if (int.Parse(year) < 2000 || int.Parse(year) > 2100)
            throw new BusinessRuleValidationException("Invalid YEAR for VVN Code. Must be between 2000 and 2100.");
    }


    private string CreateCodeWithParts(string year, string nextSequence)
    {
        return $"{year.Trim()}-{PortCode}-{nextSequence.Trim()}";
    }


    protected IEnumerable<object> GetEqualityComponents()
    {
        yield return Code;
    }

    public override string ToString() => Code;
}
