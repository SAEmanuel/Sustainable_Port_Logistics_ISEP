using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffMemberRepository _repo;
    private readonly IQualificationRepository _repoQualifications;

    public StaffMemberService(IUnitOfWork unitOfWork, IStaffMemberRepository repo,
        IQualificationRepository repoQualifications)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _repoQualifications = repoQualifications;
    }

    public async Task<List<StaffMemberDto>> GetAllAsync()
    {
        var list = await this._repo.GetAllAsync();

        List<StaffMemberDto> listDto = list.ConvertAll<StaffMemberDto>(staff =>
            new StaffMemberDto(staff.Id.AsGuid(), staff.ShortName, staff.MecanographicNumber, staff.Email, staff.Phone,
                staff.Schedule, staff.IsActive, staff.Qualifications));

        return listDto;
    }

    public async Task<StaffMemberDto> GetByIdAsync(StaffMemberId id)
    {
        var staff = await this._repo.GetByIdAsync(id);

        if (staff == null)
            return null;

        return new StaffMemberDto(staff.Id.AsGuid(), staff.ShortName, staff.MecanographicNumber, staff.Email,
            staff.Phone,
            staff.Schedule, staff.IsActive, staff.Qualifications);
    }

    public async Task<StaffMemberDto> AddAsync(CreatingStaffMemberDto dto)
    {
        await CheckQualificationsIdAsync(dto.Qualifications);

        var staffMember = new StaffMember(dto.ShortName, dto.Email, dto.Phone, dto.Schedule, dto.IsActive,
            dto.Qualifications);

        await _repo.AddAsync(staffMember);
        await _unitOfWork.CommitAsync();

        return new StaffMemberDto(staffMember.Id.AsGuid(), staffMember.ShortName, staffMember.MecanographicNumber,
            staffMember.Email,
            staffMember.Phone,
            staffMember.Schedule, staffMember.IsActive, staffMember.Qualifications);
    }

    public async Task<StaffMemberDto> UpdateAsync(StaffMemberDto dto)
    {
        await CheckQualificationsIdAsync(dto.Qualifications);
        var staff = await _repo.GetByIdAsync(new StaffMemberId(dto.Id));

        if (staff == null)
            return null;

        staff.UpdateEmail(dto.Email);
        staff.UpdatePhone(dto.Phone);
        staff.UpdateSchedule(dto.Schedule);
        staff.UpdateShortName(dto.ShortName);

        await _unitOfWork.CommitAsync();

        return new StaffMemberDto(staff.Id.AsGuid(), staff.ShortName, staff.MecanographicNumber,
            staff.Email,
            staff.Phone,
            staff.Schedule, staff.IsActive, staff.Qualifications);
    }

    public async Task<StaffMemberDto> ToggleAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);

        if (staff == null)
            return null;

        staff.ToggleStatus();
        await _unitOfWork.CommitAsync();

        return new StaffMemberDto(staff.Id.AsGuid(), staff.ShortName, staff.MecanographicNumber,
            staff.Email,
            staff.Phone,
            staff.Schedule, staff.IsActive, staff.Qualifications);
    }

    private async Task CheckQualificationsIdAsync(List<Qualification> list)
    {
        foreach (var qualification in list)
            if (await _repoQualifications.GetByIdAsync(qualification.Id) == null)
                throw new BusinessRuleValidationException("Invalid Qualification Id");
    }
}