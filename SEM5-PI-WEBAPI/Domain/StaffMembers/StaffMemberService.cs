using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberService : IStaffMemberService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffMemberRepository _repo;
    private readonly IQualificationRepository _repoQualifications;
    private readonly ILogger<StaffMemberService> _logger;

    public StaffMemberService(
        IUnitOfWork unitOfWork,
        IStaffMemberRepository repo,
        IQualificationRepository repoQualifications,
        ILogger<StaffMemberService> logger)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _repoQualifications = repoQualifications;
        _logger = logger;
    }

    public async Task<List<StaffMemberDto>> GetAllAsync()
    {
        _logger.LogInformation("Business Domain: Request to fetch all Staff Members.");

        var list = await _repo.GetAllAsync();
        var dtos = await Task.WhenAll(list.Select(MapToDto));

        _logger.LogInformation("Business Domain: Returning [{Count}] Staff Members DTOs.", dtos.Length);

        return dtos.ToList();
    }

    public async Task<StaffMemberDto?> GetByIdAsync(StaffMemberId id)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Member with ID = {Id}", id.Value);

        var staff = await _repo.GetByIdAsync(id);
        if (staff == null)
        {
            _logger.LogWarning("Business Domain: No Staff Member found with ID = {Id}", id.Value);
            return null;
        }

        var dto = await MapToDto(staff);
        _logger.LogInformation("Business Domain: Staff Member with ID = {Id} found and mapped successfully.", id.Value);

        return dto;
    }

    public async Task<StaffMemberDto?> GetByMecNumberAsync(string mec)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Member with Mecanographic Number = {Mec}", mec);

        var staff = await _repo.GetByMecNumberAsync(new MecanographicNumber(mec));
        if (staff == null)
        {
            _logger.LogWarning("Business Domain: No Staff Member found with Mecanographic Number = {Mec}", mec);
            return null;
        }

        var dto = await MapToDto(staff);
        _logger.LogInformation("Business Domain: Staff Member with Mecanographic Number = {Mec} found and mapped successfully.", mec);

        return dto;
    }

    public async Task<List<StaffMemberDto>> GetByNameAsync(string name)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Members with Name = {Name}", name);

        var staff = await _repo.GetByNameAsync(name);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));

        _logger.LogInformation("Business Domain: Returning [{Count}] Staff Members with Name = {Name}.", dtos.Length, name);

        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByStatusAsync(bool status)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Members with Status = {Status}", status);

        var staff = await _repo.GetByStatusAsync(status);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));

        _logger.LogInformation("Business Domain: Returning [{Count}] Staff Members with Status = {Status}.", dtos.Length, status);

        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByQualificationsAsync(List<string> codes)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Members with Qualifications Codes: {Codes}", string.Join(',', codes));

        var ids = await GetQualificationIdsFromCodesAsync(codes);
        var staff = await _repo.GetByQualificationsAsync(ids);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));

        _logger.LogInformation("Business Domain: Returning [{Count}] Staff Members with Qualifications Codes: {Codes}.", dtos.Length, string.Join(',', codes));

        return dtos.ToList();
    }

    public async Task<List<StaffMemberDto>> GetByExactQualificationsAsync(List<string> codes)
    {
        _logger.LogInformation("Business Domain: Request to fetch Staff Members with Exact Qualifications Codes: {Codes}", string.Join(',', codes));

        var ids = await GetQualificationIdsFromCodesAsync(codes);
        var staff = await _repo.GetByExactQualificationsAsync(ids);
        var dtos = await Task.WhenAll(staff.Select(MapToDto));

        _logger.LogInformation("Business Domain: Returning [{Count}] Staff Members with Exact Qualifications Codes: {Codes}.", dtos.Length, string.Join(',', codes));

        return dtos.ToList();
    }

    public async Task<StaffMemberDto> AddAsync(CreatingStaffMemberDto dto)
    {
        _logger.LogInformation("Business Domain: Request to add new Staff Member with Email = {Email}", dto.Email);

        await EnsureNotRepeatedEmailAsync(new Email(dto.Email));
        await EnsureNotRepeatedPhoneAsync(new PhoneNumber(dto.Phone));

        var qualificationIds = dto.QualificationCodes != null
            ? await LoadQualificationsAsync(dto.QualificationCodes)
            : new List<QualificationId>();

        var mecanographicNumber = new MecanographicNumber(await GenerateMecanographicNumberAsync());

        var staffMember = StaffMemberFactory.CreateStaffMember(
            dto,
            mecanographicNumber,
            qualificationIds
        );

        await _repo.AddAsync(staffMember);
        await _unitOfWork.CommitAsync();

        var qualificationCodes = await GetQualificationCodesAsync(staffMember.Qualifications);

        _logger.LogInformation("Business Domain: Staff Member created successfully with Mecanographic Number = {MecNumber}", mecanographicNumber);

        return StaffMemberFactory.CreateStaffMemberDto(staffMember, qualificationCodes);
    }

    public async Task<StaffMemberDto> UpdateAsync(UpdateStaffMemberDto updateDto)
    {
        _logger.LogInformation("Business Domain: Request to update Staff Member with Mecanographic Number = {MecNumber}", updateDto.MecNumber);

        var staff = await _repo.GetByMecNumberAsync(new MecanographicNumber(updateDto.MecNumber));
        if (staff == null)
        {
            _logger.LogWarning("Business Domain: No Staff Member found with Mecanographic Number = {MecNumber}", updateDto.MecNumber);
            throw new BusinessRuleValidationException($"No StaffMember with mec number: {updateDto.MecNumber}");
        }

        if (updateDto.Email != null)
        {
            var emailToCheck = new Email(updateDto.Email);
            await EnsureNotRepeatedEmailAsync(emailToCheck);
        }

        if (updateDto.Phone != null)
        {
            var phoneToCheck = new PhoneNumber(updateDto.Phone);
            await EnsureNotRepeatedPhoneAsync(phoneToCheck);
        }

        if (updateDto.ShortName != null)
            staff.UpdateShortName(updateDto.ShortName);

        if (updateDto.Email != null)
            staff.UpdateEmail(new Email(updateDto.Email));

        if (updateDto.Phone != null)
            staff.UpdatePhone(new PhoneNumber(updateDto.Phone));

        if (updateDto.Schedule != null)
            staff.UpdateSchedule(updateDto.Schedule.ToDomain());

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
                var qualification = await _repoQualifications.GetQualificationByCodeAsync(code);
                if (qualification != null)
                {
                    staff.AddQualification(qualification.Id);
                }
                else
                {
                    throw new BusinessRuleValidationException($"Qualification Code: {code} not in Database");
                }
            }
        }
        else if (updateDto.QualificationCodes != null && updateDto.AddQualifications == false)
        {
            var qualificationIds = await LoadQualificationsAsync(updateDto.QualificationCodes);
            staff.SetQualifications(qualificationIds);
        }

        await _unitOfWork.CommitAsync();

        var qualificationCodes = await GetQualificationCodesAsync(staff.Qualifications);

        _logger.LogInformation("Business Domain: Staff Member with Mecanographic Number = {MecNumber} updated successfully.", updateDto.MecNumber);

        return StaffMemberFactory.CreateStaffMemberDto(staff, qualificationCodes);
    }

    public async Task<StaffMemberDto?> ToggleAsync(string mec)
    {
        _logger.LogInformation("Business Domain: Request to toggle status of Staff Member with Mecanographic Number = {MecNumber}", mec);

        var staff = await _repo.GetByMecNumberAsync(new MecanographicNumber(mec));
        if (staff == null)
        {
            _logger.LogWarning("Business Domain: No Staff Member found with Mecanographic Number = {MecNumber}", mec);
            return null;
        }

        staff.ToggleStatus();
        await _unitOfWork.CommitAsync();

        var qualificationCodes = await GetQualificationCodesAsync(staff.Qualifications);

        _logger.LogInformation("Business Domain: Status toggled for Staff Member with Mecanographic Number = {MecNumber}", mec);

        return StaffMemberFactory.CreateStaffMemberDto(staff, qualificationCodes);
    }

    private async Task EnsureNotRepeatedEmailAsync(Email email)
    {
        bool repeatedEmail = await _repo.EmailIsInTheSystem(email);
        if (repeatedEmail)
        {
            _logger.LogWarning("Business Domain: Repeated Email detected: {Email}", email.ToString());
            throw new BusinessRuleValidationException("Repeated Email for StaffMember!");
        }
    }

    private async Task EnsureNotRepeatedPhoneAsync(PhoneNumber phone)
    {
        bool repeatedPhone = await _repo.PhoneIsInTheSystem(phone);
        if (repeatedPhone)
        {
            _logger.LogWarning("Business Domain: Repeated Phone Number detected: {Phone}", phone.ToString());
            throw new BusinessRuleValidationException("Repeated Phone Number for StaffMember!");
        }
    }

    private async Task<List<QualificationId>> LoadQualificationsAsync(List<string> codes)
    {
        var qualificationIds = new List<QualificationId>();
        foreach (var code in codes)
        {
            var q = await _repoQualifications.GetQualificationByCodeAsync(code);
            if (q == null)
                throw new BusinessRuleValidationException($"Invalid Qualification Code: {code}");
            qualificationIds.Add(q.Id);
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
            var q = await _repoQualifications.GetQualificationByCodeAsync(code);
            if (q != null)
                ids.Add(q.Id);
        }

        if (codes.Count() != ids.Count())
            throw new BusinessRuleValidationException("Please review the qualifications provided, some do not exist!");

        return ids;
    }

    private async Task<List<string>> GetQualificationCodesAsync(IReadOnlyCollection<QualificationId> qualificationIds)
    {
        var codes = new List<string>();

        if (qualificationIds == null || !qualificationIds.Any())
            return codes;

        foreach (var qualificationId in qualificationIds)
        {
            var qualification = await _repoQualifications.GetByIdAsync(qualificationId);
            if (qualification != null)
                codes.Add(qualification.Code);
        }

        return codes;
    }

    private async Task<StaffMemberDto> MapToDto(StaffMember staff)
    {
        var qualificationCodes = await GetQualificationCodesAsync(staff.Qualifications);
        return StaffMemberFactory.CreateStaffMemberDto(staff, qualificationCodes);
    }
}
