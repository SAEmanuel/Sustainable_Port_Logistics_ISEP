using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;

public class ShippingAgentOrganizationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShippingAgentOrganizationRepository _repo;

    public ShippingAgentOrganizationService(IUnitOfWork unitOfWork, IShippingAgentOrganizationRepository repo)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
    }

    public async Task<List<ShippingAgentOrganizationDto>> GetAllAsync()
    {
        var list = await this._repo.GetAllAsync();

        List<ShippingAgentOrganizationDto> listDto = list.ConvertAll<ShippingAgentOrganizationDto>(q =>
            new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.Code, q.LegalName,q.AltName,q.Address,q.Taxnumber));

        return listDto;
    }

    public async Task<ShippingAgentOrganizationDto> GetByIdAsync(ShippingAgentOrganizationId id)
    {
        var q = await this._repo.GetByIdAsync(id);

        if (q == null)
            return null;

        return new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.Code, q.LegalName,q.AltName,q.Address,q.Taxnumber);
    }

    public async Task<ShippingAgentOrganization> AddAsync(CreatingShippingAgentOrganizationDto dto)
    {

        var shippingAgentOrganization = new ShippingAgentOrganization(dto.Code, dto.LegalName, dto.AltName,dto.Address,dto.Taxnumber);
        await _repo.AddAsync(shippingAgentOrganization);
        await _unitOfWork.CommitAsync();
        return shippingAgentOrganization;
    }
}