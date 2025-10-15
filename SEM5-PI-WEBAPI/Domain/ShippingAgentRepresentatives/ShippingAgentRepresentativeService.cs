using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public class ShippingAgentRepresentativeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShippingAgentRepresentativeRepository _repo;
    private readonly IShippingAgentOrganizationRepository _shippingAgentOrganizationRepository;
    private readonly IVesselVisitNotificationRepository _vesselVisitNotificationRepository;

    public ShippingAgentRepresentativeService(IUnitOfWork unitOfWork, IShippingAgentRepresentativeRepository repo,
        IShippingAgentOrganizationRepository shippingAgentOrganizationRepository, IVesselVisitNotificationRepository vesselVisitNotificationRepository)
    {
        _unitOfWork = unitOfWork;
        _shippingAgentOrganizationRepository =  shippingAgentOrganizationRepository;
        _vesselVisitNotificationRepository = vesselVisitNotificationRepository;
        _repo = repo;
    }

    public async Task<List<ShippingAgentRepresentativeDto>> GetAllAsync()
    {
        var list = await this._repo.GetAllAsync();

        List<ShippingAgentRepresentativeDto> listDto = list.ConvertAll<ShippingAgentRepresentativeDto>(q =>
            new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality,q.Email,q.PhoneNumber,q.Status,q.SAO,q.Notifs));

        return listDto;
    }

    public async Task<ShippingAgentRepresentativeDto> GetByIdAsync(ShippingAgentRepresentativeId id)
    {
        var q = await this._repo.GetByIdAsync(id);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality,q.Email,q.PhoneNumber,q.Status,q.SAO,q.Notifs);
    }
    
    public async Task<ShippingAgentRepresentativeDto> GetByNameAsync(string Name)
    {
        var q = await this._repo.GetByNameAsync(Name);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality,q.Email,q.PhoneNumber,q.Status,q.SAO,q.Notifs);   
    }

    public async Task<ShippingAgentRepresentativeDto> GetByEmailAsync(string Email)
    {
        var q = await this._repo.GetByEmailAsync(Email);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality, q.Email, q.PhoneNumber, q.Status, q.SAO, q.Notifs);
    }
    
     public async Task<ShippingAgentRepresentativeDto> GetByCitizenId(string cId)
    {
        var q = await this._repo.GetByCitizenIdAsync(cId);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality,q.Email,q.PhoneNumber,q.Status,q.SAO,q.Notifs);   
    }

    public async Task<ShippingAgentRepresentativeDto> GetByStatusAsync(Status Status)
    {
        var q = await this._repo.GetByStatusAsync(Status);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality, q.Email, q.PhoneNumber, q.Status, q.SAO, q.Notifs);
    }

    public async Task<ShippingAgentRepresentativeDto> GetBySaoAsync(ShippingOrganizationCode Code)
    {
        var q = await this._repo.GetBySaoAsync(Code);

        if (q == null)
            return null;

        return new ShippingAgentRepresentativeDto(q.Id.AsGuid(), q.Name, q.CitizenId, q.Nationality, q.Email, q.PhoneNumber, q.Status, q.SAO, q.Notifs);
    }

    public async Task<ShippingAgentRepresentativeDto> AddAsync(CreatingShippingAgentRepresentativeDto dto)
    {

        //verfica se já existe algum SAR com o Id de cidadão do SAR a ser criado
        var idExist = await _repo.GetByCitizenIdAsync(dto.CitizenId);
        if (idExist != null) throw new BusinessRuleValidationException($"An SAR with citizen Id '{dto.CitizenId}' already exists on DB.");
       
        
        if (!Enum.TryParse<Status>(dto.Status, true, out var status))
            throw new BusinessRuleValidationException($"Invalid status '{dto.Status}'. Must be 'activated' or 'deactivated'.");

        var saoInDb = await _shippingAgentOrganizationRepository.GetByCodeAsync(new ShippingOrganizationCode(dto.Sao));
        if (saoInDb == null) throw new BusinessRuleValidationException($"SAO '{dto.Sao}' not found in Db.");
        
        var saoCode = new ShippingOrganizationCode(dto.Sao);
        
        //verfica se já existe algum SAR associado ao SAO que se pretende associar ao SAR que se está a criar
        var saoTaken = await _repo.GetBySaoAsync(saoCode);
        if (saoTaken != null) throw new BusinessRuleValidationException($"A representative for SAO '{dto.Sao}' already exists on DB.");
   
        var representative = new ShippingAgentRepresentative(
            dto.Name,
            dto.CitizenId,
            dto.Nationality,
            dto.Email,
            dto.PhoneNumber,
            status,
            saoCode
        );

        await _repo.AddAsync(representative);
        await _unitOfWork.CommitAsync();

        return new ShippingAgentRepresentativeDto(
            representative.Id.AsGuid(),
            representative.Name,
            representative.CitizenId,
            representative.Nationality,
            representative.Email,
            representative.PhoneNumber,
            representative.Status,
            representative.SAO,
            representative.Notifs
        );
    }



     public async Task<ShippingAgentRepresentativeDto> PatchByNameAsync(string name, UpdatingShippingAgentRepresentativeDto dto)
    {

        var representative = await _repo.GetByNameAsync(name);

        if (representative == null)
            throw new BusinessRuleValidationException($"No representative found with name {name}.");

        if (!string.IsNullOrWhiteSpace(dto.Email))
            representative.UpdateEmail(dto.Email);

        if (dto.Status != null)
            representative.UpdateStatus(dto.Status.ToString());
    
        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            representative.UpdatePhoneNumber(dto.PhoneNumber);

        await _unitOfWork.CommitAsync();

        return new ShippingAgentRepresentativeDto(
            representative.Name,
            representative.CitizenId,
            representative.Nationality,
            representative.Email,
            representative.PhoneNumber,
            representative.Status,
            representative.SAO,
            representative.Notifs
        );
    }
     
     
    public async Task<ShippingAgentRepresentativeDto> AddNotificationAsync(string representativeName, string vvnCode)
    {
        var representative = await _repo.GetByNameAsync(representativeName);

        if (representative == null)
            throw new BusinessRuleValidationException($"No representative found with name '{representativeName}'.");

        var vvnInDb = await _vesselVisitNotificationRepository.GetByCodeAsync(new VvnCode(vvnCode));
        
        if (vvnInDb == null) throw new BusinessRuleValidationException($"No VVN with code {vvnCode} found on Db.");
        
        representative.AddNotification(vvnInDb.Code);

        await _unitOfWork.CommitAsync();

        return new ShippingAgentRepresentativeDto(
            representative.Id.AsGuid(),
            representative.Name,
            representative.CitizenId,
            representative.Nationality,
            representative.Email,
            representative.PhoneNumber,
            representative.Status,
            representative.SAO,
            representative.Notifs
        );
    }

}