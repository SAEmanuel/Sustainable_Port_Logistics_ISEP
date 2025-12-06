using SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Users;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public class DataRightRequestService : IDataRightRequestService
{
    private readonly IDataRightRequestRepository _repository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DataRightRequestService(IDataRightRequestRepository repository, IUnitOfWork unitOfWork, IUserRepository userRepository)
    {
       this._repository = repository;
       this._userRepository = userRepository;
       this._unitOfWork = unitOfWork;
    }

    public async Task<DataRightsRequestDto> CreateDataRightRequest(DataRightsRequestDto dto)
    {
        var hasOneInProcess = await _repository.CheckIfUserHasANonFinishRequestByType(dto.UserEmail,dto.Type);

        if (hasOneInProcess != null) throw new BusinessRuleValidationException($"Request not created. User {dto.UserEmail} already has one request of type {dto.Type} being processed ({hasOneInProcess.Status})-> {hasOneInProcess.RequestId}.");

        var createdRequest = DataRightsRequestFactory.ConvertDtoToEntity(dto);
        
        await _repository.AddAsync(createdRequest);
        await _unitOfWork.CommitAsync();
        
        return DataRightsRequestMapper.CreateDataRightsRequestDto(createdRequest);
    }

    
    // ---Admin
    public async Task<DataRightsRequestDto> AssignResponsibleToDataRightRequestAsync(string requestId, string responsibleEmail)
    {
        var existUserInDb = await _userRepository.GetByEmailAsync(responsibleEmail);

        if (existUserInDb == null)
            throw new BusinessRuleValidationException(
                $"Cannot associate responsible to request {requestId} because the specified responsible dont exist. Contact an 'admin'.");
        
        var existRequestInDb = await _repository.GetRequestByIdentifier(requestId);
        
        if (existRequestInDb == null) throw new BusinessRuleValidationException(
            $"Cannot associate responsible {existUserInDb.Name} to request {requestId} because the specified 'request id' does not exist. Contact an 'admin'.");

        existRequestInDb.AssignResponsibleToRequest(existRequestInDb.UserEmail);
        await _unitOfWork.CommitAsync();
        
        return  DataRightsRequestMapper.CreateDataRightsRequestDto(existRequestInDb);
    }

    public async Task<List<DataRightsRequestDto>> GetAllDataRightRequestsWithStatusWaitingForAssignment()
    {
        var listRequestWithStatusWaitingForAssignment =
            await _repository.GetAllDataRightRequestsWithStatusWaitingForAssignment();
        
        return listRequestWithStatusWaitingForAssignment.Select(r => DataRightsRequestMapper.CreateDataRightsRequestDto(r)).ToList();
    }
}