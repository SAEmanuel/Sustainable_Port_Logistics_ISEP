using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects
{

    [Owned]
    public class EmailAddress : IValueObject
    {
        private static readonly Regex EmailPattern =
            new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public string Address { get;}

        protected EmailAddress() { } // EF Core

        public EmailAddress(string address)
        {
            if (string.IsNullOrWhiteSpace(address))
                throw new BusinessRuleValidationException("Email address cannot be null or whitespace.");

            if (!EmailPattern.IsMatch(address.Trim()))
                throw new BusinessRuleValidationException("Email format is not a valid format.");

            Address = address.Trim().ToLowerInvariant();
        }

        public override string ToString() => Address;

        public override bool Equals(object? obj)
        {
            if (obj is not EmailAddress other)
                return false;

            return Address.Equals(other.Address, StringComparison.OrdinalIgnoreCase);
        }

        public override int GetHashCode() => Address.ToLowerInvariant().GetHashCode();

        public static implicit operator string(EmailAddress email) => email.Address;
        public static explicit operator EmailAddress(string value) => new(value);
    }
}