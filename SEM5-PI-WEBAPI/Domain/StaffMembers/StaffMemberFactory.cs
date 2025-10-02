using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public static class StaffMemberFactory
{
    public static StaffMember Create(
        string shortName,
        string mecanographicNumber,
        Email email,
        PhoneNumber phone,
        Schedule schedule,
        List<Qualification>? qualifications = null)
    {
        if (string.IsNullOrWhiteSpace(shortName) || shortName.Length > 20)
            throw new BusinessRuleValidationException("ShortName is invalid.");

        if (string.IsNullOrWhiteSpace(mecanographicNumber) || mecanographicNumber.Length != 7)
            throw new BusinessRuleValidationException("Mecanographic number must have exactly 7 characters.");

        var staffMember = new StaffMember(
            shortName,
            mecanographicNumber,
            email ?? throw new BusinessRuleValidationException("Email is required."),
            phone ?? throw new BusinessRuleValidationException("Phone number is required."),
            schedule ?? throw new BusinessRuleValidationException("Schedule is required."),
            isActive: true,
            qualifications ?? new List<Qualification>()
        );

        return staffMember;
    }
}