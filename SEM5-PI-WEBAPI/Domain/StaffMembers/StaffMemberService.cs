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
        return list.ConvertAll(MapToDto);
    }

    public async Task<StaffMemberDto> GetByIdAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<StaffMemberDto> GetByMecNumberAsync(string mec)
    {
        var staff = await _repo.GetByMecNumberAsync(mec);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<StaffMemberDto> GetByNameAsync(string name)
    {
        var staff = await _repo.GetByNameAsync(name);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<List<StaffMemberDto>> GetByStatusAsync(bool status)
    {
        var staff = await _repo.GetByStatusAsync(status);
        return staff.ConvertAll(MapToDto);
    }

    public async Task<List<StaffMemberDto>> GetByQualificationsAsync(List<QualificationId> ids)
    {
        var staff = await _repo.GetByQualificationsAsync(ids);
        return staff.ConvertAll(MapToDto);
    }

    public async Task<List<StaffMemberDto>> GetByExactQualificationsAsync(List<QualificationId> ids)
    {
        var staff = await _repo.GetByExactQualificationsAsync(ids);
        return staff.ConvertAll(MapToDto);
    }

    public async Task<StaffMemberDto> AddAsync(CreatingStaffMemberDto dto)
    {
        await EnsureNotRepeatedAsync(dto.Email, dto.Phone, null);

        var qualificationIds = dto.QualificationIds ?? new List<Guid>();
        var list = qualificationIds.Select(q => new QualificationId(q)).ToList();
        var qualifications = await LoadQualificationsAsync(list);

        var mecanographicNumber = await GenerateMecanographicNumberAsync();

        var staffMember = new StaffMember(
            dto.ShortName,
            mecanographicNumber,
            dto.Email,
            dto.Phone,
            dto.Schedule,
            qualifications
        );

        await _repo.AddAsync(staffMember);
        await _unitOfWork.CommitAsync();

        return MapToDto(staffMember);
    }


    public async Task<StaffMemberDto> UpdateAsync(StaffMemberId id, UpdateStaffMemberDto updateDto)
    {
        var staff = await _repo.GetByIdAsync(id);
        if (staff == null)
            return null;

        if (updateDto.Email != null || updateDto.Phone != null)
        {
            var emailToCheck = updateDto.Email ?? staff.Email;
            var phoneToCheck = updateDto.Phone ?? staff.Phone;
            await EnsureNotRepeatedAsync(emailToCheck, phoneToCheck, id);
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

        if (updateDto.QualificationIds != null)
        {
            var qualifications = await LoadQualificationsAsync(
                updateDto.QualificationIds.Select(q => new QualificationId(q)).ToList()
            );
            staff.Qualifications.Clear();
            foreach (var q in qualifications)
                staff.AddQualification(q);
        }

        await _unitOfWork.CommitAsync();
        return MapToDto(staff);
    }


    public async Task<StaffMemberDto> ToggleAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);
        if (staff == null)
            return null;

        staff.ToggleStatus();
        await _unitOfWork.CommitAsync();

        return MapToDto(staff);
    }

    private async Task EnsureNotRepeatedAsync(Email email, PhoneNumber phone, StaffMemberId? currentStaffId)
    {
        var allStaff = await _repo.GetAllAsync();

        bool repeatedEmail = allStaff.Any(s =>
            s.Email.Address.Equals(email.Address, StringComparison.OrdinalIgnoreCase)
            && (currentStaffId == null || s.Id != currentStaffId));

        bool repeatedPhone = allStaff.Any(s =>
            s.Phone.Number.Equals(phone.Number, StringComparison.OrdinalIgnoreCase)
            && (currentStaffId == null || s.Id != currentStaffId));

        if (repeatedEmail)
            throw new BusinessRuleValidationException("Repeated Email for StaffMember!");

        if (repeatedPhone)
            throw new BusinessRuleValidationException("Repeated Phone Number for StaffMember!");
    }


    private async Task<List<Qualification>> LoadQualificationsAsync(List<QualificationId> ids)
    {
        var qualifications = new List<Qualification>();
        foreach (var id in ids)
        {
            var q = await _repoQualifications.GetByIdAsync(id);
            if (q == null)
                throw new BusinessRuleValidationException(
                    $"Invalid Qualification Id: {id.AsGuid().ToString()}");
            qualifications.Add(q);
        }

        return qualifications;
    }

    private async Task<string> GenerateMecanographicNumberAsync()
    {
        var allStaff = await _repo.GetAllAsync();
        var year = DateTime.UtcNow.Year.ToString().Substring(2);
        var count = allStaff.Count(s => s.MecanographicNumber.Substring(1, 2) == year);
        var nextSeq = count + 1;
        return $"1{year}{nextSeq:D4}";
    }

    private static StaffMemberDto MapToDto(StaffMember staff)
    {
        return new StaffMemberDto(
            staff.Id.AsGuid(),
            staff.ShortName,
            staff.MecanographicNumber,
            staff.Email,
            staff.Phone,
            staff.Schedule,
            staff.IsActive,
            staff.Qualifications != null
                ? staff.Qualifications.Select(q => q.Id.AsGuid()).ToList()
                : new List<Guid>());
    }
}