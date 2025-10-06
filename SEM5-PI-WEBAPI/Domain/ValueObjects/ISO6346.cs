using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class Iso6346Code : IValueObject
{
    public string Value { get; private set; }

    protected Iso6346Code() {}

    public Iso6346Code(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleValidationException("ISO 6346 code can't be empty.");

        var normalized = code.Replace(" ", "").ToUpper();

        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, @"^[A-Z]{4}\d{7}$"))
            throw new BusinessRuleValidationException("Invalid ISO 6346 format. Must be 4 letters + 7 digits.");

        if (!ValidateCheckDigit(normalized))
            throw new BusinessRuleValidationException("Invalid ISO 6346 code: check digit does not match.");

        Value = normalized;
    }

    private bool ValidateCheckDigit(string code)
    {
        // ISO 6346 check digit calculation
        // Letters get values A=10, B=12, ... Z=38 (even numbers only, skipping multiples of 11)
        // Each character * 2^position mod 11
        // Check digit = result mod 11 (10 -> 0)

        int[] letterMapping = new int[26] {
            10,12,13,14,15,16,17,18,19,20,
            21,23,24,25,26,27,28,29,30,31,
            32,34,35,36,37,38
        };

        int sum = 0;

        for (int i = 0; i < 10; i++) // first 10 chars
        {
            int value;
            char c = code[i];

            if (char.IsLetter(c))
                value = letterMapping[c - 'A'];
            else
                value = c - '0';

            sum += value * (int)Math.Pow(2, i);
        }

        int checkDigit = sum % 11;
        if (checkDigit == 10) checkDigit = 0;

        return checkDigit == (code[10] - '0');
    }

    public override string ToString() => Value;
}