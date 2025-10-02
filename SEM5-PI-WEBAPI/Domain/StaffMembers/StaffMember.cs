using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMember : Entity<StaffMemberId>
{
    [MaxLength(20)]
    public string ShortName { get; private set; }

    [MaxLength(7)]
    public string MecanographicNumber { get; private set; }

    public Email Email { get; private set; }
    public PhoneNumber Phone { get; private set; }
    public Schedule Schedule { get; private set; }
    public bool IsActive { get; private set; }
    public List<Qualification> Qualifications { get; private set; }

    // Construtor protegido → só a Factory ou EF podem instanciar
    protected StaffMember() { }

    internal StaffMember(
        string shortName,
        string mecanographicNumber,
        Email email,
        PhoneNumber phone,
        Schedule schedule,
        bool isActive,
        List<Qualification> qualifications)
    {
        Id = new StaffMemberId(Guid.NewGuid());
        ShortName = shortName;
        MecanographicNumber = mecanographicNumber;
        Email = email ?? throw new BusinessRuleValidationException("Email is required.");
        Phone = phone ?? throw new BusinessRuleValidationException("Phone number is required.");
        Schedule = schedule ?? throw new BusinessRuleValidationException("Schedule is required.");
        IsActive = isActive;
        Qualifications = qualifications ?? new List<Qualification>();
    }
    

    public void UpdateShortName(string newShortName)
    {
        if (string.IsNullOrWhiteSpace(newShortName))
            throw new BusinessRuleValidationException("ShortName cannot be empty.");
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
            throw new BusinessRuleValidationException("Duplicated Qualification, not added.");
    }

    public void RemoveQualification(Qualification qualification)
    {
        Qualifications.Remove(qualification);
    }

    public override bool Equals(object? obj)
    {
        if (obj is StaffMember other)
            return Id == other.Id;
        return false;
    }

    public override int GetHashCode() => Id.GetHashCode();
}