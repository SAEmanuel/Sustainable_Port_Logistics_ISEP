using SEM5_PI_WEBAPI.Domain.BusinessShared;
using System;
using System.Collections.Generic;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

public class UpdateStaffMemberDto
{
    public string? ShortName { get; set; }
    public Email? Email { get; set; }
    public PhoneNumber? Phone { get; set; }
    public Schedule? Schedule { get; set; }
    public bool? IsActive { get; set; }
    public List<Guid>? QualificationIds { get; set; }

    public UpdateStaffMemberDto()
    {
    }

    public UpdateStaffMemberDto(string? shortName, Email? email, PhoneNumber? phone, Schedule? schedule, bool? isActive,
        List<Guid>? qualificationIds)
    {
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        QualificationIds = qualificationIds;
    }
}