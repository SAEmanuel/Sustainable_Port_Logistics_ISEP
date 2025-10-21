using System.Runtime.Intrinsics.X86;
using System.Text.RegularExpressions;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public enum Status
{
    activated,
    deactivated
}

public class ShippingAgentRepresentative : Entity<ShippingAgentRepresentativeId>, IAggregateRoot
{
    public string Name { get; set; }
    public CitizenId CitizenId { get; private set; }
    public Nationality Nationality { get; set; }
    public EmailAddress Email { get; set; }
    public PhoneNumber PhoneNumber { get; set; }

    public Status Status { get; set; }

    public ShippingOrganizationCode SAO { get; set; }

    public List<VvnCode> Notifs { get; set; } 

    protected ShippingAgentRepresentative() { }

    public ShippingAgentRepresentative(string name, CitizenId citizenId, Nationality nationality, EmailAddress email, PhoneNumber phoneNumber,Status status, ShippingOrganizationCode sao)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        Status = status;
        SAO = sao;
        Notifs = new List<VvnCode>();
        Id = new ShippingAgentRepresentativeId(Guid.NewGuid());
    }


    public void AddNotification(VvnCode notif)
    {
        if (notif == null)
            throw new BusinessRuleValidationException("Notification cannot be null.");

        if (Notifs.Any(n => n.Equals(notif)))
            throw new BusinessRuleValidationException($"Notification {notif.Code} already exists for this representative.");

        Notifs.Add(notif);
    }

    
    public override bool Equals(object? obj) =>
        obj is ShippingAgentRepresentative other && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();


    public override string ToString() => $"{Name}: {CitizenId}: {Nationality}: {Email}: {PhoneNumber}";

    public void UpdateEmail(EmailAddress email)
    {
        Email = email;
    }
    public void UpdateStatus(string status)
    {
       if (string.IsNullOrWhiteSpace(status))
        throw new ArgumentException("Status cannot be null or empty.", nameof(status));

        // Try to parse the string to a valid enum value (case-insensitive)
        if (Enum.TryParse<Status>(status, true, out var parsedStatus))
        {
            Status = parsedStatus;
        }
        else
        {
            throw new ArgumentException($"Invalid status value: {status}. Valid values are: {string.Join(", ", Enum.GetNames(typeof(Status)))}");
        }
    }
    public void UpdatePhoneNumber(PhoneNumber phoneNumber)
    {
        PhoneNumber = phoneNumber;
    }
}