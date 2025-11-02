using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;

namespace SEM5_PI_WEBAPI.Domain.Qualifications
{
    public interface IQualificationService
    {
        Task<List<QualificationDto>> GetAllAsync();
        Task<QualificationDto> GetByIdAsync(QualificationId id);
        Task<QualificationDto> GetByCodeAsync(string code);
        Task<QualificationDto> GetByNameAsync(string name);
        Task<QualificationDto> AddAsync(CreatingQualificationDto dto);
        Task<QualificationDto?> UpdateAsync(QualificationId id, UpdateQualificationDto dto);
    }
}