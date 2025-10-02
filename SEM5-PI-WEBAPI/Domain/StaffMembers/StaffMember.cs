using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMember : Entity<StaffMemberId>
{
    [MaxLength(20)] public string ShortName { get; set; }
    [MaxLength(7)] public string MecanographicNumber { get; private set; }
    public Email Email { get; set; }
    public PhoneNumber Phone { get; set; }
    public Schedule Schedule { get; set; }
    public bool IsActive { get; set; }
    public List<Qualification> Qualifications { get; private set; }

    protected StaffMember()
    {
    }

    public StaffMember(string shortName, Email email, PhoneNumber phone,
        Schedule schedule, bool isActive, List<Qualification>? qualifications)
    {
        Id = new StaffMemberId(Guid.NewGuid());
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        Qualifications = qualifications ?? new List<Qualification>();
    }

    public void UpdateShortName(string newShortName)
    {
        if (string.IsNullOrWhiteSpace(newShortName))
            throw new ArgumentException("ShortName cannot be empty");
        ShortName = newShortName;
    }

    public void UpdateEmail(Email newEmail)
    {
        Email = newEmail ?? throw new BusinessRuleValidationException("Invalid email!");
    }

    public void UpdatePhone(PhoneNumber newPhone)
    {
        Phone = newPhone ?? throw new BusinessRuleValidationException("Invalid Phone number!");
    }

    public void UpdateSchedule(Schedule newSchedule)
    {
        Schedule = newSchedule ?? throw new BusinessRuleValidationException("Invalid Schedule!");
    }

    public void ToggleStatus()
    {
        IsActive = !IsActive;
    }

    public void AddQualification(Qualification qualification)
    {
        if (!Qualifications.Contains(qualification))
            Qualifications.Add(qualification);
        else
            throw new BusinessRuleValidationException("Duplicated Qualification, not added...");
    }

    public void RemoveQualification(Qualification qualification)
    {
        Qualifications.Remove(qualification);
    }

    public void SetMecanographicNumber(string mec)
    {
        MecanographicNumber = mec;
    }

    public override bool Equals(object obj)
    {
        if (obj is StaffMember other)
            return Id == other.Id;
        return false;
    }

    public override int GetHashCode() => Id.GetHashCode();
}