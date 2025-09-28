using System.Threading.Tasks;

namespace SEM5_PI_WEBAPI.Shared
{
    public interface IUnitOfWork
    {
        Task<int> CommitAsync();
    }
}