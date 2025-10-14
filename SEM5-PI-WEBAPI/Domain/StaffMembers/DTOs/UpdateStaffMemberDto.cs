using SEM5_PI_WEBAPI.Domain.BusinessShared;
using System;
using System.Collections.Generic;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

public class UpdateStaffMemberDto
{
    public string MecNumber { get; }
    public string? ShortName { get; set; }
    public Email? Email { get; set; }
    public PhoneNumber? Phone { get; set; }
    public Schedule? Schedule { get; set; }
    public bool? IsActive { get; set; }
    public List<string>? QualificationCodes { get; set; }
    public bool? AddQualifications { get; set; }

    public UpdateStaffMemberDto()
    {
    }

    public UpdateStaffMemberDto(string mecNumber, string? shortName, Email? email, PhoneNumber? phone, Schedule? schedule, bool? isActive,
        List<string>? qualificationCodes, bool? addQualifications)
    {
        MecNumber = mecNumber;
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        QualificationCodes = qualificationCodes;
        AddQualifications = addQualifications;
    }
}