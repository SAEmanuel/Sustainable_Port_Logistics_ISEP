using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffMemberRepository _repo;
    private readonly IQualificationRepository _repoQualifications;

    public StaffMemberService(
        IUnitOfWork unitOfWork,
        IStaffMemberRepository repo,
        IQualificationRepository repoQualifications)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _repoQualifications = repoQualifications;
    }

    public async Task<List<StaffMemberDto>> GetAllAsync()
    {
        var list = await _repo.GetAllAsync();
        var dtos = await Task.WhenAll(list.Select(MapToDto));
        return dtos.ToList();
    }

    public async Task<StaffMemberDto?> GetByIdAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);
        return staff == null ? null : await MapToDto(staff);
    }

    public async Task<StaffMemberDto?> GetByMecNumberAsync(string m)
    {
        var mec = new MecanographicNumber(m);
        var staff = await _repo.GetByMecNumberAsync(mec);
        return staff == null ? null : await MapToDto(staff);
    }

    public async Task<List<StaffMemberDto>> GetByNameAsync(string name)
    {
        var staff = await _repo.GetByNameAsync(name);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));
        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByStatusAsync(bool status)
    {
        var staff = await _repo.GetByStatusAsync(status);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));
        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByQualificationsAsync(List<string> codes)
    {
        var ids = await GetQualificationIdsFromCodesAsync(codes);
        var staff = await _repo.GetByQualificationsAsync(ids);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));
        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByExactQualificationsAsync(List<string> codes)
    {
        var ids = await GetQualificationIdsFromCodesAsync(codes);
        var staff = await _repo.GetByExactQualificationsAsync(ids);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));
        return dtos.ToList();
    }

    
    public async Task<StaffMemberDto> AddAsync(CreatingStaffMemberDto dto)
    {
        await EnsureNotRepeatedAsync(dto.Email, dto.Phone);

        var qualificationCodes = dto.QualificationCodes;
        List<QualificationId> qualificationIds = new();

        if (qualificationCodes != null)
        {
            qualificationIds = await LoadQualificationsAsync(qualificationCodes);
        }

        var mecanographicNumber = await GenerateMecanographicNumberAsync();

        var staffMember = new StaffMember(
            dto.ShortName,
            new MecanographicNumber(mecanographicNumber),
            dto.Email,
            dto.Phone,
            dto.Schedule,
            qualificationIds
        );

        await _repo.AddAsync(staffMember);
        await _unitOfWork.CommitAsync();

        return await MapToDto(staffMember);
    }

    public async Task<StaffMemberDto> UpdateAsync(UpdateStaffMemberDto updateDto)
    {
        var staff = await _repo.GetByMecNumberAsync(new MecanographicNumber(updateDto.MecNumber));
        if (staff == null)
            throw new BusinessRuleValidationException($"No StaffMember with mec number: {updateDto.MecNumber}");

        if (updateDto.Email != null || updateDto.Phone != null)
        {
            var emailToCheck = updateDto.Email ?? staff.Email;
            var phoneToCheck = updateDto.Phone ?? staff.Phone;
            await EnsureNotRepeatedAsync(emailToCheck, phoneToCheck);
        }

        if (updateDto.ShortName != null)
            staff.UpdateShortName(updateDto.ShortName);

        if (updateDto.Email != null)
            staff.UpdateEmail(updateDto.Email);

        if (updateDto.Phone != null)
            staff.UpdatePhone(updateDto.Phone);

        if (updateDto.Schedule != null)
            staff.UpdateSchedule(updateDto.Schedule);

        if (updateDto.IsActive.HasValue)
            staff.IsActive = updateDto.IsActive.Value;

        if (updateDto.QualificationCodes != null && updateDto.AddQualifications == null)
        {
            throw new BusinessRuleValidationException(
                "Please specify whether you want to add or just replace the qualifications provided.");
        }

        if (updateDto.QualificationCodes != null && updateDto.AddQualifications == true)
        {
            foreach (var code in updateDto.QualificationCodes)
            {
                var qualificationId = await _repoQualifications.GetQualificationIdByCodeAsync(code);
                if (qualificationId != null)
                {
                    staff.AddQualification(qualificationId);
                }
            }
        }
        else if (updateDto.QualificationCodes != null && updateDto.AddQualifications == false)
        {
            var qualificationIds = new List<QualificationId>();
            foreach (var code in updateDto.QualificationCodes)
            {
                var qualificationId = await _repoQualifications.GetQualificationIdByCodeAsync(code);
                if (qualificationId != null)
                {
                    qualificationIds.Add(qualificationId);
                }
            }

            staff.SetQualifications(qualificationIds);
        }

        await _unitOfWork.CommitAsync();
        return await MapToDto(staff);
    }

    public async Task<StaffMemberDto?> ToggleAsync(string mec)
    {
        var staff = await _repo.GetByMecNumberAsync(new MecanographicNumber(mec));
        if (staff == null)
            return null;

        staff.ToggleStatus();
        await _unitOfWork.CommitAsync();

        return await MapToDto(staff);
    }

    private async Task EnsureNotRepeatedAsync(Email email, PhoneNumber phone)
    {
        var allStaff = await _repo.GetAllAsync();

        bool repeatedEmail = allStaff.Any(s =>
            s.Email.Address.Equals(email.Address, StringComparison.OrdinalIgnoreCase));

        bool repeatedPhone = allStaff.Any(s =>
            s.Phone.Number.Equals(phone.Number, StringComparison.OrdinalIgnoreCase));

        if (repeatedEmail)
            throw new BusinessRuleValidationException("Repeated Email for StaffMember!");

        if (repeatedPhone)
            throw new BusinessRuleValidationException("Repeated Phone Number for StaffMember!");
    }

    private async Task<List<QualificationId>> LoadQualificationsAsync(List<string> codes)
    {
        var qualificationIds = new List<QualificationId>();
        foreach (var code in codes)
        {
            var q = await _repoQualifications.GetQualificationIdByCodeAsync(code);
            if (q == null)
                throw new BusinessRuleValidationException(
                    $"Invalid Qualification Code: {code}");
            qualificationIds.Add(q);
        }

        return qualificationIds;
    }

    private async Task<string> GenerateMecanographicNumberAsync()
    {
        var allStaff = await _repo.GetAllAsync();
        var currentYear = DateTime.UtcNow.Year % 100;

        var count = allStaff.Count(s =>
        {
            if (s.MecanographicNumber == null) return false;
            return s.MecanographicNumber.Year == currentYear;
        });

        var nextSeq = count + 1;
        return $"1{currentYear:D2}{nextSeq:D4}";
    }
    
    private async Task<List<QualificationId>> GetQualificationIdsFromCodesAsync(List<string> codes)
    {
        var ids = new List<QualificationId>();

        if (codes == null || !codes.Any())
            return ids;

        foreach (var code in codes)
        {
            var id = await _repoQualifications.GetQualificationIdByCodeAsync(code);
            if (id != null)
                ids.Add(id);
        }

        return ids;
    }

    private async Task<StaffMemberDto> MapToDto(StaffMember staff)
    {
        List<string> codes = new();

        if (staff.Qualifications != null)
        {
            foreach (var q in staff.Qualifications)
            {
                var qualification = await _repoQualifications.GetByIdAsync(q);
                codes.Add(qualification.Code);
            }
        }

        return new StaffMemberDto(
            staff.Id.AsGuid(),
            staff.ShortName,
            staff.MecanographicNumber.Value,
            staff.Email,
            staff.Phone,
            staff.Schedule,
            staff.IsActive,
            staff.Qualifications != null ? codes : new List<string>()
        );
    }
}