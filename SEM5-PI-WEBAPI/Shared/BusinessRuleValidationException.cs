using System;

namespace SEM5_PI_WEBAPI.Shared
{
    public class BusinessRuleValidationException : Exception
    {
        public string Details { get; }

        public BusinessRuleValidationException(string message) : base(message)
        {
            
        }

        public BusinessRuleValidationException(string message, string details) : base(message)
        {
            this.Details = details;
        }
    }
}