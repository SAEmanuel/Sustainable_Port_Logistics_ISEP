using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.Shared;
using SQLitePCL;

namespace SEM5_PI_WEBAPI.Infraestructure.Qualifications;

public class QualificationRepository : BaseRepository<Qualification, QualificationId>, IQualificationRepository
{
    private readonly DbSet<Qualification> _context;
    public QualificationRepository(DddSample1DbContext context) : base(context.Qualifications)
    {
        _context = context.Qualifications;
    }

    public async Task<bool> ExistQualificationID(QualificationId qualificationId)
    {
        return await ExistsAsync(q => q.Id.Equals(qualificationId));
    }
    
    public async Task<Qualification?> GetQualificationByCode(string code)
    {
        return await _context.FirstOrDefaultAsync(r => r.Code.Equals(code));
    }

    public async Task<Qualification?> GetQualificationByName(string name)
    {
        return await _context.FirstOrDefaultAsync(r => r.Name.Equals(name));
    }

    public async Task<QualificationId?> GetQualificationIdByCodeAsync(string code)
    {
        var qualification = await GetQualificationByCode(code);
        if (qualification != null)
            return qualification.Id;

        return null;  
    }

    
}