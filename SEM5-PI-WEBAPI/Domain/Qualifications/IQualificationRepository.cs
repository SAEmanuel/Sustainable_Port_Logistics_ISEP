using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.Qualifications
{
    public interface IQualificationRepository : IRepository<Qualification, QualificationId>
    {
        Task<bool> ExistQualificationID(QualificationId qualificationId);
        Task<Qualification?> GetQualificationByCode(string code);
        Task<Qualification?> GetQualificationByName(string name);
    }
}