using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

using System;
using System.Text.RegularExpressions;

public class PhoneNumber : IValueObject
{
    private static readonly Regex PhoneRegex = new Regex(
        @"^\+[1-9]\d{1,14}$", 
        RegexOptions.Compiled);

    public string Number { get; private set; }  

    protected PhoneNumber() { } 

    public PhoneNumber(string number)
    {
        if (string.IsNullOrWhiteSpace(number))
            throw new ArgumentException("Phone number cannot be empty.");

        if (!PhoneRegex.IsMatch(number))
            throw new ArgumentException("Invalid phone number format.");

        Number = number;
    }

    public override string ToString() => Number;

    public override bool Equals(object? obj) =>
        obj is PhoneNumber other && Number == other.Number;

    public override int GetHashCode() => Number.GetHashCode();
}