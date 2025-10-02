using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

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

    public async Task<StaffMemberDto?> GetByIdAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<StaffMemberDto> AddAsync(CreatingStaffMemberDto dto)
    {
        var qualifications = await LoadQualificationsAsync(dto.QualificationIds);
        
        var mecanographicNumber = await GenerateMecanographicNumberAsync();
        
        var staffMember = StaffMemberFactory.Create(
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

    public async Task<StaffMemberDto?> UpdateAsync(StaffMemberDto dto)
    {
        var staff = await _repo.GetByIdAsync(new StaffMemberId(dto.Id));
        if (staff == null) return null;
        
        staff.UpdateShortName(dto.ShortName);
        staff.UpdateEmail(dto.Email);
        staff.UpdatePhone(dto.Phone);
        staff.UpdateSchedule(dto.Schedule);
        
        var qualifications = await LoadQualificationsAsync(dto.QualificationIds);
        staff.Qualifications.Clear();
        foreach (var q in qualifications)
            staff.AddQualification(q);

        await _unitOfWork.CommitAsync();
        return MapToDto(staff);
    }

    public async Task<StaffMemberDto?> ToggleAsync(StaffMemberId id)
    {
        var staff = await _repo.GetByIdAsync(id);
        if (staff == null) return null;

        staff.ToggleStatus();
        await _unitOfWork.CommitAsync();

        return MapToDto(staff);
    }
    

    private async Task<List<Qualification>> LoadQualificationsAsync(List<QualificationId> ids)
    {
        var qualifications = new List<Qualification>();
        foreach (var id in ids)
        {
            var q = await _repoQualifications.GetByIdAsync(id);
            if (q == null)
                throw new BusinessRuleValidationException($"Invalid Qualification Id: {id}");
            qualifications.Add(q);
        }
        return qualifications;
    }

    private async Task<string> GenerateMecanographicNumberAsync()
    {
        var allStaff = await _repo.GetAllAsync();
        var year = DateTime.UtcNow.Year.ToString("yy");
        var count = allStaff.Count(s => s.MecanographicNumber.Substring(1, 2) == year);
        var nextSeq = count + 1;

        return $"1{year}{nextSeq:D3}";
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
            staff.Qualifications.Select(q => q.Id).ToList()
        );
    }
}