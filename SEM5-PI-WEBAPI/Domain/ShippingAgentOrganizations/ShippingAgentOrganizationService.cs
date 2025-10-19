using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;

public class ShippingAgentOrganizationService: IShippingAgentOrganizationService
{
    private readonly ILogger<ShippingAgentOrganizationService> _logger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShippingAgentOrganizationRepository _repo;

    public ShippingAgentOrganizationService(ILogger<ShippingAgentOrganizationService> logger,IUnitOfWork unitOfWork, IShippingAgentOrganizationRepository repo)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
        _repo = repo;
    }

    public async Task<List<ShippingAgentOrganizationDto>> GetAllAsync()
    {
        var list = await this._repo.GetAllAsync();

        List<ShippingAgentOrganizationDto> listDto = list.ConvertAll<ShippingAgentOrganizationDto>(q =>
            new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.ShippingOrganizationCode, q.LegalName,q.AltName,q.Address,q.Taxnumber));

        return listDto;
    }

    public async Task<ShippingAgentOrganizationDto> GetByIdAsync(ShippingAgentOrganizationId id)
    {
        var q = await this._repo.GetByIdAsync(id);

        if (q == null)
            return null;

        return new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.ShippingOrganizationCode, q.LegalName,q.AltName,q.Address,q.Taxnumber);
    }
    
    public async Task<ShippingAgentOrganizationDto> GetByLegalNameAsync(string legalname)
    {
        var q = await this._repo.GetByLegalNameAsync(legalname);

        if (q == null)
            return null;

        return new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.ShippingOrganizationCode, q.LegalName, q.AltName, q.Address, q.Taxnumber);
    }
    
    public async Task<ShippingAgentOrganizationDto> GetByCodeAsync(ShippingOrganizationCode shippingOrganizationCode)
    {
        
        var q = await this._repo.GetByCodeAsync(shippingOrganizationCode);

        if (q == null)
            return null;

        return new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.ShippingOrganizationCode, q.LegalName, q.AltName, q.Address, q.Taxnumber);
    }

    public async Task<ShippingAgentOrganizationDto> GetByTaxNumberAsync(TaxNumber taxnumber)
    {
        var q = await this._repo.GetByTaxNumberAsync(taxnumber);

        if (q == null)
            return null;

        return new ShippingAgentOrganizationDto(q.Id.AsGuid(), q.ShippingOrganizationCode, q.LegalName, q.AltName, q.Address, q.Taxnumber);
    }


    public async Task<ShippingAgentOrganizationDto> CreateAsync(CreatingShippingAgentOrganizationDto creatingshippingAgentOrganizationDto)
    {

        _logger.LogInformation("Business Domain: Request to add new Shipping Agent Organization with code  = {CODE}", creatingshippingAgentOrganizationDto.ShippingOrganizationCode);

        //verificação de duplicados com o mesmo código
        var code = new ShippingOrganizationCode(creatingshippingAgentOrganizationDto.ShippingOrganizationCode);
        var codeExist = await _repo.GetByCodeAsync(code);
        if (codeExist != null)
            throw new BusinessRuleValidationException($"SAO with code '{creatingshippingAgentOrganizationDto.ShippingOrganizationCode}' already exists on DB.");

        //verificação de duplicados com o mesmo tax number
        var tax = new TaxNumber(creatingshippingAgentOrganizationDto.Taxnumber);
        var taxExist = await _repo.GetByTaxNumberAsync(tax);
        if (taxExist != null)
            throw new BusinessRuleValidationException($"SAO with tax number '{creatingshippingAgentOrganizationDto.Taxnumber}' already exists on DB.");

        //verificação de duplicados com o mesmo legal name
        var legalExist = await _repo.GetByLegalNameAsync(creatingshippingAgentOrganizationDto.LegalName);
        if (legalExist != null)
            throw new BusinessRuleValidationException($"SAO with legal name '{creatingshippingAgentOrganizationDto.LegalName}' already exists on DB.");

        ShippingAgentOrganization createdOrg = ShippingAgentOrganizationFactory.CreateEntity(creatingshippingAgentOrganizationDto);
         
        await _repo.AddAsync(createdOrg);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Business Domain: SAO Created Successfully with Code Number [{CODE}] and System ID [{ID}].", createdOrg.ShippingOrganizationCode,createdOrg.Id);

        return ShippingAgentOrganizationFactory.CreateDto(createdOrg);
    }
}