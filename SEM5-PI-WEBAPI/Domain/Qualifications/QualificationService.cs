using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Qualifications;

public class QualificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQualificationRepository _repo;

    public QualificationService(IUnitOfWork unitOfWork, IQualificationRepository repo)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
    }

    public async Task<List<QualificationDto>> GetAllAsync()
    {
        var list = await this._repo.GetAllAsync();

        List<QualificationDto> listDto = list.ConvertAll<QualificationDto>(q =>
            new QualificationDto(q.Id.AsGuid(),
                q.Name,
                q.Code));

        return listDto;
    }

    public async Task<QualificationDto> GetByIdAsync(QualificationId id)
    {
        var q = await this._repo.GetByIdAsync(id);

        if (q == null)
            return null;

        return new QualificationDto(q.Id.AsGuid(),
            q.Name,
            q.Code);
    }

    public async Task<QualificationDto> GetByCodeAsync(string code)
    {
        var qualy = await _repo.GetQualificationByCode(code);
        
        if (qualy == null)
            throw new BusinessRuleValidationException($"No qualification with code {code} was found");

        return MapToDto(qualy);
    }

    public async Task<QualificationDto> GetByNameAsync(string name)
    {
        var qualy = await _repo.GetQualificationByName(name);
        
        if (qualy == null)
            throw new BusinessRuleValidationException($"No qualification with name {name} was found");
        
        return MapToDto(qualy);
    }

    public async Task<string> GenerateNextQualificationCodeAsync()
    {
        var allCodes = await _repo.GetAllAsync();

        var maxNumber = allCodes.Where(q => !string.IsNullOrEmpty(q.Code))
            .Select(q => int.Parse(q.Code.Substring(4))).Count();

        string nextCode = $"QLF-{(maxNumber + 1).ToString("D3")}";
        return nextCode;
    }

    public async Task<QualificationDto> AddAsync(CreatingQualificationDto dto)
    {
        await EnsureNotRepeatedAsync(dto);

        string code = await GetCodeAsync(dto);

        var qualification = new Qualification(dto.Name);
        qualification.UpdateCode(code);

        await _repo.AddAsync(qualification);
        await _unitOfWork.CommitAsync();

        return new QualificationDto(qualification.Id.AsGuid(), qualification.Name, qualification.Code);
    }


    private async Task EnsureNotRepeatedAsync(CreatingQualificationDto dto)
    {
        var allQualifications = await _repo.GetAllAsync();

        bool repeatedCode = !string.IsNullOrEmpty(dto.Code) && allQualifications.Any(q => q.Code == dto.Code);
        bool repeatedName = allQualifications.Any(q => q.Name.Trim().Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (repeatedName)
            throw new BusinessRuleValidationException("Repeated Qualification name!");
        if (repeatedCode)
            throw new BusinessRuleValidationException("Repeated Qualification code!");
    }

    private async Task<string> GetCodeAsync(CreatingQualificationDto dto)
    {
        if (!string.IsNullOrEmpty(dto.Code))
        {
            return FormatCode(dto.Code);
        }

        return await GenerateNextQualificationCodeAsync();
    }

    public async Task<QualificationDto?> UpdateAsync(QualificationId id, CreatingQualificationDto dto)
    {
        var qualification = await _repo.GetByIdAsync(id);
        if (qualification == null) return null;
        
        if(dto.Code != null) {qualification.UpdateCode(FormatCode(dto.Code));}
        if (dto.Name != null) {qualification.UpdateName(dto.Name);}
        
        await _unitOfWork.CommitAsync();
        return MapToDto(qualification);
    }

    private static QualificationDto MapToDto(Qualification qualification)
    {
        return new QualificationDto(qualification.Id.AsGuid(), qualification.Name, qualification.Code);
    }

    private string FormatCode(string code)
    {
        var parts = code.Split('-');
        if (parts.Length == 2 && int.TryParse(parts[1], out int number))
        {
            return $"{parts[0]}-{number:D3}";
        }

        return code;
    }
}