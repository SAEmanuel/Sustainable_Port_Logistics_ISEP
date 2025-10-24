using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.StaffMembers;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public class ShippingAgentRepresentativeService: IShippingAgentRepresentativeService
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
            ShippingAgentRepresentativeFactory.CreateDto(q));

        return listDto;
    }

    public async Task<ShippingAgentRepresentativeDto> GetByIdAsync(ShippingAgentRepresentativeId id)
    {
        var q = await this._repo.GetByIdAsync(id);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);
    }
    
    public async Task<ShippingAgentRepresentativeDto> GetByNameAsync(string Name)
    {
        var q = await this._repo.GetByNameAsync(Name);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);    
    }

    public async Task<ShippingAgentRepresentativeDto> GetByEmailAsync(EmailAddress Email)
    {
        var q = await this._repo.GetByEmailAsync(Email);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);
        }
    
     public async Task<ShippingAgentRepresentativeDto> GetByCitizenId(CitizenId cId)
    {
        var q = await this._repo.GetByCitizenIdAsync(cId);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);   
    }

    public async Task<ShippingAgentRepresentativeDto> GetByStatusAsync(Status Status)
    {
        var q = await this._repo.GetByStatusAsync(Status);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);
    }

    public async Task<ShippingAgentRepresentativeDto> GetBySaoAsync(ShippingOrganizationCode Code)
    {
        var q = await this._repo.GetBySaoAsync(Code);

        if (q == null)
            return null;

        return ShippingAgentRepresentativeFactory.CreateDto(q);    
    }

    public async Task<ShippingAgentRepresentativeDto> AddAsync(CreatingShippingAgentRepresentativeDto dto)
    {

        //verfica se já existe algum SAR com o Id de cidadão do SAR a ser criado
        var idExist = await _repo.GetByCitizenIdAsync(dto.CitizenId);
        if (idExist != null) throw new BusinessRuleValidationException($"An SAR with citizen Id '{dto.CitizenId}' already exists on DB.");
       
        var emailExist = await _repo.GetByEmailAsync(dto.Email);
        if (emailExist != null) throw new BusinessRuleValidationException($"An SAR with email address '{dto.Email}' already exists on DB.");
       
        
        if (!Enum.TryParse<Status>(dto.Status, true, out var status))
            throw new BusinessRuleValidationException($"Invalid status '{dto.Status}'. Must be 'activated' or 'deactivated'.");

        var saoInDb = await _shippingAgentOrganizationRepository.GetByCodeAsync(new ShippingOrganizationCode(dto.Sao));
        if (saoInDb == null) throw new BusinessRuleValidationException($"SAO '{dto.Sao}' not found in Db.");
        
        var saoCode = new ShippingOrganizationCode(dto.Sao);
        
        //verfica se já existe algum SAR associado ao SAO que se pretende associar ao SAR que se está a criar
        var saoTaken = await _repo.GetBySaoAsync(saoCode);
        if (saoTaken != null) throw new BusinessRuleValidationException($"A representative for SAO '{dto.Sao}' already exists on DB.");

        ShippingAgentRepresentativeFactory.CreateEntity(dto);

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
    
        return ShippingAgentRepresentativeFactory.CreateDto(representative);
    }



     public async Task<ShippingAgentRepresentativeDto> PatchByEmailAsync(EmailAddress email, UpdatingShippingAgentRepresentativeDto dto)
    {

        var representative = await _repo.GetByEmailAsync(email);

        if (representative == null)
            throw new BusinessRuleValidationException($"No representative found with email {email}.");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var emailExist = await _repo.GetByEmailAsync(dto.Email);
            if (emailExist != null)
            {
                throw new BusinessRuleValidationException($"An SAR with email address '{dto.Email}' already exists on DB.");

            }else{
                
                representative.UpdateEmail(dto.Email);
            }
            
        }

        if (dto.Status != null)
            representative.UpdateStatus(dto.Status.ToString());
    
        if (dto.PhoneNumber != null)
            representative.UpdatePhoneNumber(dto.PhoneNumber);

        await _unitOfWork.CommitAsync();

        return ShippingAgentRepresentativeFactory.CreateDto(representative);
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