using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Qualifications;

public class QualificationService : IQualificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQualificationRepository _repo;
    private readonly ILogger<QualificationService> _logger;

    public QualificationService(IUnitOfWork unitOfWork, IQualificationRepository repo, ILogger<QualificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _logger = logger;
        _logger.LogInformation("QualificationService instantiated.");
    }

    public async Task<List<QualificationDto>> GetAllAsync()
    {
        _logger.LogInformation("Fetching all qualifications.");
        var list = await _repo.GetAllAsync();
        var dtos = QualificationMapper.ToDtoList(list); 
        _logger.LogInformation("Returning {Count} qualifications.", dtos.Count);
        return dtos;
    }

    public async Task<QualificationDto> GetByIdAsync(QualificationId id)
    {
        _logger.LogInformation("Fetching qualification with ID: {Id}", id.Value);
        var q = await _repo.GetByIdAsync(id);

        if (q == null)
        {
            _logger.LogWarning("Qualification with ID: {Id} not found.", id.Value);
            return null;
        }

        var dto = QualificationMapper.ToDto(q); 
        _logger.LogInformation("Qualification with ID: {Id} found.", id.Value);
        return dto;
    }

    public async Task<QualificationDto> GetByCodeAsync(string code)
    {
        _logger.LogInformation("Fetching qualification with code: {Code}", code);
        var qualy = await _repo.GetQualificationByCodeAsync(code);

        if (qualy == null)
        {
            _logger.LogWarning("No qualification found with code: {Code}", code);
            throw new BusinessRuleValidationException($"No qualification with code {code} was found");
        }

        var dto = QualificationMapper.ToDto(qualy);
        _logger.LogInformation("Qualification found for code: {Code}", code);
        return dto;
    }

    public async Task<QualificationDto> GetByNameAsync(string name)
    {
        _logger.LogInformation("Fetching qualification with name: {Name}", name);
        var qualy = await _repo.GetQualificationByName(name);

        if (qualy == null)
        {
            _logger.LogWarning("No qualification found with name: {Name}", name);
            throw new BusinessRuleValidationException($"No qualification with name {name} was found");
        }

        var dto = QualificationMapper.ToDto(qualy);
        _logger.LogInformation("Qualification found for name: {Name}", name);
        return dto;
    }

    public async Task<QualificationDto> AddAsync(CreatingQualificationDto dto)
    {
        _logger.LogInformation("Adding new qualification with name: {Name}", dto.Name);
        await EnsureNotRepeatedAsync(dto);

        string code = await GetCodeAsync(dto);
        var dtoWithCode = new CreatingQualificationDto(dto.Name, code);

        var qualification = QualificationFactory.CreateQualification(dtoWithCode); 

        await _repo.AddAsync(qualification);
        await _unitOfWork.CommitAsync();

        var resultDto = QualificationMapper.ToDto(qualification);
        _logger.LogInformation("Qualification created with ID: {Id}", resultDto.Id);
        return resultDto;
    }

    public async Task<QualificationDto?> UpdateAsync(QualificationId id, CreatingQualificationDto dto)
    {
        _logger.LogInformation("Updating qualification with ID: {Id}", id.Value);
        await EnsureNotRepeatedNameAsync(dto);
        var qualification = await _repo.GetByIdAsync(id);
        if (qualification == null)
        {
            _logger.LogWarning("Qualification with ID: {Id} not found for update.", id.Value);
            return null;
        }

        if (dto.Code != null)
        {
            qualification.UpdateCode(FormatCode(dto.Code));
        }

        if (dto.Name != null)
        {
            qualification.UpdateName(dto.Name);
        }

        await _unitOfWork.CommitAsync();

        var updatedDto = QualificationMapper.ToDto(qualification);
        _logger.LogInformation("Qualification with ID: {Id} updated successfully.", id.Value);
        return updatedDto;
    }

    private async Task EnsureNotRepeatedAsync(CreatingQualificationDto dto)
    {
        _logger.LogInformation("Checking for repeated qualification name or code.");
        var allQualifications = await _repo.GetAllAsync();

        bool repeatedCode = !string.IsNullOrEmpty(dto.Code) &&
                           allQualifications.Any(q => q.Code == dto.Code);
        bool repeatedName = allQualifications.Any(q =>
                           q.Name.Trim().Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (repeatedName)
        {
            _logger.LogWarning("Repeated qualification name detected: {Name}", dto.Name);
            throw new BusinessRuleValidationException("Repeated Qualification name!");
        }
        if (repeatedCode)
        {
            _logger.LogWarning("Repeated qualification code detected: {Code}", dto.Code);
            throw new BusinessRuleValidationException("Repeated Qualification code!");
        }
    }
    
    private async Task EnsureNotRepeatedNameAsync(CreatingQualificationDto dto)
    {
        _logger.LogInformation("Checking for repeated qualification name.");
        var allQualifications = await _repo.GetAllAsync();
        
        bool repeatedName = allQualifications.Any(q =>
            q.Name.Trim().Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (repeatedName)
        {
            _logger.LogWarning("Repeated qualification name detected: {Name}", dto.Name);
            throw new BusinessRuleValidationException("Repeated Qualification name!");
        }
        
    }

    private async Task<string> GetCodeAsync(CreatingQualificationDto dto)
    {
        _logger.LogInformation("Generating qualification code if needed for: {Name}", dto.Name);
        if (!string.IsNullOrEmpty(dto.Code))
        {
            var formattedCode = FormatCode(dto.Code);
            _logger.LogInformation("Using provided qualification code: {Code}", formattedCode);
            return formattedCode;
        }

        string generatedCode = await GenerateNextQualificationCodeAsync();
        _logger.LogInformation("Generated new qualification code: {Code}", generatedCode);
        return generatedCode;
    }

    private async Task<string> GenerateNextQualificationCodeAsync()
    {
        var allCodes = await _repo.GetAllAsync();

        var maxNumber = allCodes
            .Where(q => !string.IsNullOrEmpty(q.Code))
            .Select(q => int.Parse(q.Code.Substring(4)))
            .Count();

        string nextCode = $"QLF-{(maxNumber + 1).ToString("D3")}";
        return nextCode;
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
