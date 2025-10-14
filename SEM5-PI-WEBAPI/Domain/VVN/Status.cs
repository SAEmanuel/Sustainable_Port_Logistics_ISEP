using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public enum VvnStatus
{
    InProgress,
    PendingInformation,
    Withdrawn,
    Submitted,
    Accepted
}

public class Status : IValueObject
{
    private const int MaxMessageLength = 200;

    public VvnStatus StatusValue { get; set; }
    public string? Message { get; set; }

    public Status(VvnStatus statusValue, string? message)
    {
        if (message != null && message.Length > MaxMessageLength)
        {
            throw new ArgumentException($"Message cannot be longer than {MaxMessageLength} characters.");
        }

        StatusValue = statusValue;
        Message = message;
    }
    
    public override string ToString()
    {
        return $"Status: {StatusValue}";
    }

   
    public string ToString(bool showMessage)
    {
        if (showMessage && !string.IsNullOrEmpty(Message))
        {
            return $"Status: {StatusValue}, Message: {Message}";
        }
        else
        {
            return ToString();
        }
    }
}
