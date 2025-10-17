using Microsoft.IdentityModel.Tokens;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Containers.DTOs;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;


namespace SEM5_PI_WEBAPI.Domain.VVN;

public class VesselVisitNotificationService : IVesselVisitNotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<VesselVisitNotificationService> _logger;
    private readonly ICargoManifestRepository _cargoManifestRepository;
    private readonly ICargoManifestEntryRepository _cargoManifestEntryRepository;
    private readonly ICrewManifestRepository _crewManifestRepository;
    private readonly ICrewMemberRepository _crewMemberRepository;
    private readonly IShippingAgentRepresentativeRepository _shippingAgentRepresentativeRepository;
    private readonly IShippingAgentOrganizationRepository _shippingAgentOrganizationRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IDockRepository _dockRepository;
    private readonly IVesselRepository _vesselRepository;
    private readonly IContainerRepository _containerRepository;
    private readonly IVesselVisitNotificationRepository _repo;
    private readonly ITaskRepository _taskRepository;

    public VesselVisitNotificationService(
        IUnitOfWork unitOfWork,
        ICargoManifestRepository cargoManifestRepository,
        ICargoManifestEntryRepository cargoManifestEntriesRepository,
        ICrewManifestRepository crewManifestRepository,
        ICrewMemberRepository crewMemberRepository,
        IStorageAreaRepository storageAreaRepository,
        IShippingAgentRepresentativeRepository shippingAgentRepresentativeRepository,
        IShippingAgentOrganizationRepository shippingAgentOrganizationRepository,
        IVesselRepository vesselRepository,
        IDockRepository dockRepository,
        IContainerRepository containerRepository,
        IVesselVisitNotificationRepository repo,
        ITaskRepository taskRepository,
        ILogger<VesselVisitNotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _cargoManifestRepository = cargoManifestRepository;
        _cargoManifestEntryRepository = cargoManifestEntriesRepository;
        _crewManifestRepository = crewManifestRepository;
        _crewMemberRepository = crewMemberRepository;
        _storageAreaRepository = storageAreaRepository;
        _vesselRepository = vesselRepository;
        _dockRepository = dockRepository;
        _containerRepository = containerRepository;
        _shippingAgentRepresentativeRepository = shippingAgentRepresentativeRepository;
        _shippingAgentOrganizationRepository = shippingAgentOrganizationRepository;
        _repo = repo;
        _taskRepository = taskRepository;
    }


    public async Task<VesselVisitNotificationDto> AddAsync(CreatingVesselVisitNotificationDto dto)
    {
        if (dto == null)
            throw new BusinessRuleValidationException("Invalid request: DTO cannot be null.");

        _logger.LogInformation("Business Domain: Request to add new Vessel Visit Notification (VVN).");

        var loadingCargoManifest = await CreateCargoManifestAsync(dto.LoadingCargoManifest);
        var unloadingCargoManifest = await CreateCargoManifestAsync(dto.UnloadingCargoManifest);
        var crewManifest = await CreateCrewManifestAsync(dto.CrewManifest);
        await _unitOfWork.CommitAsync();

        var vvnCode = await GenerateNextVvnCodeAsync();
        var vesselImo = await CheckForVesselInDb(dto.VesselImo);

        if (unloadingCargoManifest != null)
            checkNeededPersonel(unloadingCargoManifest, crewManifest);

        if (loadingCargoManifest != null)
            checkNeededPersonel(loadingCargoManifest, crewManifest);

        var newVesselVisitNotification = VesselVisitNotificationFactory.CreateVesselVisitNotification(
            vvnCode,
            dto.EstimatedTimeArrival,
            dto.EstimatedTimeDeparture,
            dto.Volume,
            null,
            crewManifest,
            loadingCargoManifest,
            unloadingCargoManifest,
            vesselImo
        );


        await _repo.AddAsync(newVesselVisitNotification);
        await _unitOfWork.CommitAsync();

        _logger.LogInformation("Business Domain: VVN successfully created with ID = {Id}",
            newVesselVisitNotification.Id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(newVesselVisitNotification);
    }

    public async Task<VesselVisitNotificationDto> GetByIdAsync(VesselVisitNotificationId id)
    {
        _logger.LogInformation("Business Domain: Fetching VVN with ID = {Id}", id.Value);

        var vvnInDb = await _repo.GetCompleteByIdAsync(id);
        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with ID = {id.Value}");

        _logger.LogInformation("Business Domain: VVN with ID = {Id} found successfully.", id.Value);
        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> AcceptVvnAsync(VvnCode code)
    {
        _logger.LogInformation("Business Domain: Accepting VVN with Code = {code}", code.ToString());

        VesselVisitNotificationId id = await GetIdByCodeAsync(code);
        var vvnInDb = await _repo.GetCompleteByIdAsync(id);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with Code = {code}");

        vvnInDb.Accept();
        var tasks = new List<EntityTask>();
        var dock = await BasicDockAttributionAlgorithm(vvnInDb.VesselImo);
        vvnInDb.UpdateDock(dock);

        if (vvnInDb.UnloadingCargoManifest != null)
        {
            var unloadingTasks = await CreateTasksAsync(vvnInDb.UnloadingCargoManifest, dock);
            tasks.AddRange(unloadingTasks);
        }

        if (vvnInDb.LoadingCargoManifest != null)
        {
            var loadingTasks = await CreateTasksAsync(vvnInDb.LoadingCargoManifest, dock);
            tasks.AddRange(loadingTasks);
        }

        vvnInDb.SetTasks(tasks);

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with Code = {code} Accepted successfully.", code.ToString());

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> MarkAsPendingAsync(RejectVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("Business Domain: Marking VVN as Pending Information for code = {code}", dto.VvnCode);

        VesselVisitNotificationId id = await GetIdByCodeAsync(new VvnCode(dto.VvnCode));
        var vvnInDb = await _repo.GetByIdAsync(id)
                      ?? throw new BusinessRuleValidationException(
                          $"No Vessel Visit Notification found with Code = {dto.VvnCode}");

        vvnInDb.MarkPending(dto.Reason);

        await _unitOfWork.CommitAsync();

        _logger.LogInformation(
            "VVN with Code = {code} marked as Pending Information with message \"{message}\" successfully.",
            dto.VvnCode,
            dto.Reason);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }


    public async Task<VesselVisitNotificationDto> WithdrawByIdAsync(VesselVisitNotificationId id)
    {
        _logger.LogInformation("Business Domain: Withdrawing VVN with ID = {Id}", id.Value);

        var vvnInDb = await _repo.GetCompleteByIdAsync(id);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with ID = {id.Value}");

        vvnInDb.Withdraw();

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with ID = {Id} withdrew successfully.", id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> WithdrawByCodeAsync(VvnCode code)
    {
        _logger.LogInformation("Business Domain: Withdrawing VVN with ID = {code}", code.Code);

        var vvnInDb = await _repo.GetCompleteByCodeAsync(code);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with Code = {code.Code}");

        vvnInDb.Withdraw();

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with Code = {code} withdrew successfully.", code.Code);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> SubmitByCodeAsync(VvnCode code)
    {
        _logger.LogInformation("Business Domain: Submitting VVN with ID = {code}", code.Code);

        var vvnInDb = await _repo.GetCompleteByCodeAsync(code);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with Code = {code.Code}");

        vvnInDb.Submit();

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with Code = {code} submitted successfully.", code.Code);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> SubmitByIdAsync(VesselVisitNotificationId id)
    {
        _logger.LogInformation("Business Domain: Submitting VVN with ID = {Id}", id.Value);

        var vvnInDb = await _repo.GetCompleteByIdAsync(id);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with ID = {id.Value}");

        vvnInDb.Submit();

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with ID = {Id} submitted successfully.", id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }


    public async Task<VesselVisitNotificationDto> UpdateAsync(VesselVisitNotificationId id,
        UpdateVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("Business Domain: Updating VVN with ID = {Id}", id.Value);

        var vvnInDb = await _repo.GetByIdAsync(id);

        if (vvnInDb == null)
            throw new BusinessRuleValidationException($"No Vessel Visit Notification found with ID = {id.Value}");

        if (!vvnInDb.IsEditable)
            throw new BusinessRuleValidationException(
                "Only VVNs with status 'InProgress' or 'PendingInformation' can be edited.");

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
            vvnInDb.UpdateEstimatedTimeArrival(new ClockTime(DateTime.Parse(dto.EstimatedTimeArrival)));

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeDeparture))
            vvnInDb.UpdateEstimatedTimeDeparture(new ClockTime(DateTime.Parse(dto.EstimatedTimeDeparture)));

        if (dto.Volume.HasValue) vvnInDb.UpdateVolume(dto.Volume.Value);

        if (dto.Documents != null) vvnInDb.UpdateDocuments(dto.Documents);

        if (dto.Dock != null) vvnInDb.UpdateDock(new DockCode(dto.Dock));


        if (dto.CrewManifest != null)
        {
            var crewManifest = await CreateCrewManifestAsync(dto.CrewManifest);
            vvnInDb.UpdateCrewManifest(crewManifest);
        }

        if (dto.LoadingCargoManifest != null)
        {
            var loadingManifest = await CreateCargoManifestAsync(dto.LoadingCargoManifest);
            vvnInDb.UpdateLoadingCargoManifest(loadingManifest);
        }

        if (dto.UnloadingCargoManifest != null)
        {
            var unloadingManifest = await CreateCargoManifestAsync(dto.UnloadingCargoManifest);
            vvnInDb.UpdateUnloadingCargoManifest(unloadingManifest);
        }

        if (!string.IsNullOrWhiteSpace(dto.ImoNumber))
        {
            var imoCode = new ImoNumber(dto.ImoNumber);
            var foundVesselWithImo = await _vesselRepository.GetByImoNumberAsync(imoCode);

            if (foundVesselWithImo == null)
                throw new BusinessRuleValidationException($"No vessel with IMO Number {imoCode} was found.");

            vvnInDb.UpdateImoNumber(foundVesselWithImo.ImoNumber);
        }

        await _unitOfWork.CommitAsync();

        _logger.LogInformation("VVN with ID = {Id} updated successfully.", id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }


    public async Task<List<VesselVisitNotificationDto>>
        GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(
            Guid idSarWhoImAm, FilterInProgressPendingVvnStatusDto dto)
    {
        _logger.LogInformation("Starting VVN filtering for SAR {SAR_ID} with filters: {@Filters}", idSarWhoImAm, dto);

        var listRepresentatives = await GetShippingAgentRepresentativesBySaoAsync(idSarWhoImAm);
        _logger.LogInformation("Loaded {Count} SARs belonging to the same organization.", listRepresentatives.Count);

        var listVvnFiltered = await GetVvnForSpecificRepresentative(dto.SpecificRepresentative, listRepresentatives);
        _logger.LogInformation("Initial VVN pool size before filtering: {Count}", listVvnFiltered.Count);

        if (listVvnFiltered.Count == 0)
        {
            _logger.LogWarning("No VVNs found for SAR {SAR_ID} before applying filters.", idSarWhoImAm);
            return new List<VesselVisitNotificationDto>();
        }

        listVvnFiltered = listVvnFiltered
            .Where(v => v.Status.StatusValue == VvnStatus.InProgress ||
                        v.Status.StatusValue == VvnStatus.PendingInformation)
            .ToList();

        _logger.LogInformation("After status filter (InProgress + PendingInformation): {Count} VVNs remain.",
            listVvnFiltered.Count);

        if (listVvnFiltered.Count == 0)
        {
            _logger.LogWarning("No VVNs remain after filtering by status for SAR {SAR_ID}.", idSarWhoImAm);
            return new List<VesselVisitNotificationDto>();
        }

        if (!string.IsNullOrWhiteSpace(dto.VesselImoNumber))
        {
            _logger.LogInformation("Applying IMO filter with value: {IMO}", dto.VesselImoNumber);
            listVvnFiltered = await GetVvnsFilterByImoNumber(listVvnFiltered, dto.VesselImoNumber);
            _logger.LogInformation("After IMO filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
        {
            _logger.LogInformation("Applying ETA filter with value: {ETA}", dto.EstimatedTimeArrival);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeArrival(listVvnFiltered, dto.EstimatedTimeArrival);
            _logger.LogInformation("After ETA filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeDeparture))
        {
            _logger.LogInformation("Applying ETD filter with value: {ETD}", dto.EstimatedTimeDeparture);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeDeparture(listVvnFiltered, dto.EstimatedTimeDeparture);
            _logger.LogInformation("After ETD filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        var result = VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(listVvnFiltered);
        _logger.LogInformation("Finished filtering. Total VVNs returned: {Count}", result.Count);

        return result;
    }


    public async Task<List<VesselVisitNotificationDto>> GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync(
        Guid idSarWhoImAm, FilterWithdrawnVvnStatusDto dto)
    {
        _logger.LogInformation("Starting Withdrawn VVNs query for SAR {SAR_ID} with filters: {@Filters}", idSarWhoImAm,
            dto);

        var listRepresentatives = await GetShippingAgentRepresentativesBySaoAsync(idSarWhoImAm);
        _logger.LogInformation("Loaded {Count} representatives under same organization.", listRepresentatives.Count);

        var listVvnFiltered = await GetVvnForSpecificRepresentative(dto.SpecificRepresentative, listRepresentatives);
        _logger.LogInformation("Initial Withdrawn VVN pool size: {Count}", listVvnFiltered.Count);

        if (listVvnFiltered.Count == 0)
        {
            _logger.LogWarning("No VVNs found for SAR {SAR_ID} before applying filters.", idSarWhoImAm);
            return new List<VesselVisitNotificationDto>();
        }

        listVvnFiltered = listVvnFiltered
            .Where(v => v.Status.StatusValue == VvnStatus.Withdrawn)
            .ToList();

        _logger.LogInformation("After Withdrawn status filter: {Count} VVNs remain.", listVvnFiltered.Count);

        if (!string.IsNullOrWhiteSpace(dto.VesselImoNumber))
        {
            _logger.LogInformation("Applying IMO filter: {IMO}", dto.VesselImoNumber);
            listVvnFiltered = await GetVvnsFilterByImoNumber(listVvnFiltered, dto.VesselImoNumber);
            _logger.LogInformation("After IMO filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
        {
            _logger.LogInformation("Applying ETA filter: {ETA}", dto.EstimatedTimeArrival);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeArrival(listVvnFiltered, dto.EstimatedTimeArrival);
            _logger.LogInformation("After ETA filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeDeparture))
        {
            _logger.LogInformation("Applying ETD filter: {ETD}", dto.EstimatedTimeDeparture);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeDeparture(listVvnFiltered, dto.EstimatedTimeDeparture);
            _logger.LogInformation("After ETD filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        var result = VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(listVvnFiltered);
        _logger.LogInformation("Withdrawn VVN filtering completed. Total results: {Count}", result.Count);

        return result;
    }


    public async Task<List<VesselVisitNotificationDto>> GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(
        Guid idSarWhoImAm, FilterSubmittedVvnStatusDto dto)
    {
        _logger.LogInformation("Starting Submitted VVNs query for SAR {SAR_ID} with filters: {@Filters}", idSarWhoImAm,
            dto);

        var listRepresentatives = await GetShippingAgentRepresentativesBySaoAsync(idSarWhoImAm);
        _logger.LogInformation("Loaded {Count} representatives under same organization.", listRepresentatives.Count);

        var listVvnFiltered = await GetVvnForSpecificRepresentative(dto.SpecificRepresentative, listRepresentatives);
        _logger.LogInformation("Initial Submitted VVN pool size: {Count}", listVvnFiltered.Count);

        if (listVvnFiltered.Count == 0)
        {
            _logger.LogWarning("No VVNs found for SAR {SAR_ID} before applying filters.", idSarWhoImAm);
            return new List<VesselVisitNotificationDto>();
        }

        listVvnFiltered = listVvnFiltered
            .Where(v => v.Status.StatusValue == VvnStatus.Submitted)
            .ToList();

        _logger.LogInformation("After Submitted status filter: {Count} VVNs remain.", listVvnFiltered.Count);

        if (!string.IsNullOrWhiteSpace(dto.VesselImoNumber))
        {
            _logger.LogInformation("Applying IMO filter: {IMO}", dto.VesselImoNumber);
            listVvnFiltered = await GetVvnsFilterByImoNumber(listVvnFiltered, dto.VesselImoNumber);
            _logger.LogInformation("After IMO filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
        {
            _logger.LogInformation("Applying ETA filter: {ETA}", dto.EstimatedTimeArrival);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeArrival(listVvnFiltered, dto.EstimatedTimeArrival);
            _logger.LogInformation("After ETA filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeDeparture))
        {
            _logger.LogInformation("Applying ETD filter: {ETD}", dto.EstimatedTimeDeparture);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeDeparture(listVvnFiltered, dto.EstimatedTimeDeparture);
            _logger.LogInformation("After ETD filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.SubmittedDate))
        {
            _logger.LogInformation("Applying submit date: {SUBM}", dto.SubmittedDate);
            listVvnFiltered = GetVvnsFilterBySubmittedDate(listVvnFiltered, dto.SubmittedDate);
            _logger.LogInformation("After submit date: {SUBM}", listVvnFiltered.Count);
        }

        var result = VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(listVvnFiltered);
        _logger.LogInformation("Submitted VVN filtering completed. Total results: {Count}", result.Count);

        return result;
    }

    public async Task<List<VesselVisitNotificationDto>> GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(
        Guid idSarWhoImAm, FilterAcceptedVvnStatusDto dto)
    {
        _logger.LogInformation("Starting Accepted VVNs query for SAR {SAR_ID} with filters: {@Filters}", idSarWhoImAm,
            dto);

        var listRepresentatives = await GetShippingAgentRepresentativesBySaoAsync(idSarWhoImAm);
        _logger.LogInformation("Loaded {Count} representatives under same organization.", listRepresentatives.Count);

        var listVvnFiltered = await GetVvnForSpecificRepresentative(dto.SpecificRepresentative, listRepresentatives);
        _logger.LogInformation("Initial Accepted VVN pool size: {Count}", listVvnFiltered.Count);

        if (listVvnFiltered.Count == 0)
        {
            _logger.LogWarning("No VVNs found for SAR {SAR_ID} before applying filters.", idSarWhoImAm);
            return new List<VesselVisitNotificationDto>();
        }

        listVvnFiltered = listVvnFiltered
            .Where(v => v.Status.StatusValue == VvnStatus.Accepted)
            .ToList();

        _logger.LogInformation("After Accepted status filter: {Count} VVNs remain.", listVvnFiltered.Count);

        if (!string.IsNullOrWhiteSpace(dto.VesselImoNumber))
        {
            _logger.LogInformation("Applying IMO filter: {IMO}", dto.VesselImoNumber);
            listVvnFiltered = await GetVvnsFilterByImoNumber(listVvnFiltered, dto.VesselImoNumber);
            _logger.LogInformation("After IMO filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
        {
            _logger.LogInformation("Applying ETA filter: {ETA}", dto.EstimatedTimeArrival);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeArrival(listVvnFiltered, dto.EstimatedTimeArrival);
            _logger.LogInformation("After ETA filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeDeparture))
        {
            _logger.LogInformation("Applying ETD filter: {ETD}", dto.EstimatedTimeDeparture);
            listVvnFiltered = GetVvnsFilterByEstimatedTimeDeparture(listVvnFiltered, dto.EstimatedTimeDeparture);
            _logger.LogInformation("After ETD filter: {Count} VVNs remain.", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.SubmittedDate))
        {
            _logger.LogInformation("Applying submit date: {SUBM}", dto.SubmittedDate);
            listVvnFiltered = GetVvnsFilterBySubmittedDate(listVvnFiltered, dto.SubmittedDate);
            _logger.LogInformation("After submit date: {SUBM}", listVvnFiltered.Count);
        }

        if (!string.IsNullOrWhiteSpace(dto.AcceptedDate))
        {
            _logger.LogInformation("Applying accepted date: {ACPT}", dto.AcceptedDate);
            listVvnFiltered = GetVvnsFilterByAcceptedDate(listVvnFiltered, dto.AcceptedDate);
            _logger.LogInformation("After accepted date: {ACPT}", listVvnFiltered.Count);
        }

        var result = VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(listVvnFiltered);
        _logger.LogInformation("Accepted VVN filtering completed. Total results: {Count}", result.Count);

        return result;
    }

    //========================================
    private List<VesselVisitNotification> GetVvnsFilterByAcceptedDate(
        List<VesselVisitNotification> vvnList, string acceptedDate)
    {
        if (string.IsNullOrWhiteSpace(acceptedDate))
        {
            _logger.LogInformation("Skipping Accepted Date filter (no value provided).");
            return vvnList;
        }

        if (!DateTime.TryParse(acceptedDate, out var parsedDate))
        {
            _logger.LogWarning("Invalid Accepted Date format received: {ACPT}", acceptedDate);
            throw new BusinessRuleValidationException(
                $"Invalid Accepted Date format: {acceptedDate}");
        }

        var filterClockTime = new ClockTime(parsedDate);
        _logger.LogInformation("Filtering VVNs by Accepted Date near {Date}", filterClockTime.Value);

        var filtered = vvnList
            .Where(v => v.AcceptenceDate != null &&
                        Math.Abs((v.AcceptenceDate.Value - filterClockTime.Value).TotalHours) <= 1)
            .ToList();

        _logger.LogInformation("Accepted Date filter result: {Count}/{Total} VVNs matched.", filtered.Count,
            vvnList.Count);
        return filtered;
    }

    private List<VesselVisitNotification> GetVvnsFilterBySubmittedDate(
        List<VesselVisitNotification> vvnList, string submittedDate)
    {
        if (string.IsNullOrWhiteSpace(submittedDate))
        {
            _logger.LogInformation("Skipping Submitted Date filter (no value provided).");
            return vvnList;
        }

        if (!DateTime.TryParse(submittedDate, out var parsedDate))
        {
            _logger.LogWarning("Invalid Submitted Date format received: {SBMT}", submittedDate);
            throw new BusinessRuleValidationException(
                $"Invalid Submitted Date format: {submittedDate}");
        }

        var filterClockTime = new ClockTime(parsedDate);
        _logger.LogInformation("Filtering VVNs by Submitted Date near {Date}", filterClockTime.Value);

        var filtered = vvnList
            .Where(v => v.SubmittedDate != null &&
                        Math.Abs((v.SubmittedDate.Value - filterClockTime.Value).TotalHours) <= 1)
            .ToList();

        _logger.LogInformation("Submitted Date filter result: {Count}/{Total} VVNs matched.", filtered.Count,
            vvnList.Count);
        return filtered;
    }

    private List<VesselVisitNotification> GetVvnsFilterByEstimatedTimeDeparture(
        List<VesselVisitNotification> vvnList, string estimatedTimeDeparture)
    {
        if (string.IsNullOrWhiteSpace(estimatedTimeDeparture))
        {
            _logger.LogInformation("Skipping ETD filter (no value provided).");
            return vvnList;
        }

        if (!DateTime.TryParse(estimatedTimeDeparture, out var parsedDate))
        {
            _logger.LogWarning("Invalid ETD format received: {ETD}", estimatedTimeDeparture);
            throw new BusinessRuleValidationException(
                $"Invalid EstimatedTimeDeparture format: {estimatedTimeDeparture}");
        }

        var filterClockTime = new ClockTime(parsedDate);
        _logger.LogInformation("Filtering VVNs by ETD near {Date}", filterClockTime.Value);

        var filtered = vvnList
            .Where(v => v.EstimatedTimeDeparture != null &&
                        Math.Abs((v.EstimatedTimeDeparture.Value - filterClockTime.Value).TotalHours) <= 1)
            .ToList();

        _logger.LogInformation("ETD filter result: {Count}/{Total} VVNs matched.", filtered.Count, vvnList.Count);
        return filtered;
    }

    private List<VesselVisitNotification> GetVvnsFilterByEstimatedTimeArrival(
        List<VesselVisitNotification> vvnList, string estimatedTimeArrival)
    {
        if (string.IsNullOrWhiteSpace(estimatedTimeArrival))
        {
            _logger.LogInformation("Skipping ETA filter (no value provided).");
            return vvnList;
        }

        if (!DateTime.TryParse(estimatedTimeArrival, out var parsedDate))
        {
            _logger.LogWarning("Invalid ETA format received: {ETA}", estimatedTimeArrival);
            throw new BusinessRuleValidationException($"Invalid EstimatedTimeArrival format: {estimatedTimeArrival}");
        }

        var filterClockTime = new ClockTime(parsedDate);
        _logger.LogInformation("Filtering VVNs by ETA near {Date}", filterClockTime.Value);

        var filtered = vvnList
            .Where(v => v.EstimatedTimeArrival != null &&
                        Math.Abs((v.EstimatedTimeArrival.Value - filterClockTime.Value).TotalHours) <= 1)
            .ToList();

        _logger.LogInformation("ETA filter result: {Count}/{Total} VVNs matched.", filtered.Count, vvnList.Count);
        return filtered;
    }


    private async Task<List<VesselVisitNotification>> GetVvnsFilterByImoNumber(
        List<VesselVisitNotification> vvnList, string imoNumber)
    {
        _logger.LogInformation("Filtering VVNs by IMO number: {IMO}", imoNumber);

        var vesselInDb = await _vesselRepository.GetByImoNumberAsync(new ImoNumber(imoNumber));

        if (vesselInDb == null)
        {
            _logger.LogWarning("No vessel found in DB with IMO {IMO}", imoNumber);
            throw new BusinessRuleValidationException($"No vessel found with IMO number {imoNumber}.");
        }

        var filtered = vvnList
            .Where(v => v.VesselImo.Value == vesselInDb.ImoNumber.Value)
            .ToList();

        _logger.LogInformation("IMO filter result: {Count}/{Total} VVNs matched.", filtered.Count, vvnList.Count);
        return filtered;
    }


    private async Task<List<VesselVisitNotification>> GetVvnForSpecificRepresentative(
        Guid? representativeId,
        List<ShippingAgentRepresentative> listRepresentatives)
    {
        _logger.LogInformation("Collecting VVNs for representative {RepId} (null = all).", representativeId);

        var listVvnCodes = new List<VvnCode>();

        if (representativeId == null)
        {
            foreach (var representative in listRepresentatives)
            {
                _logger.LogDebug("Processing SAR {Name} ({Id}) with {NotifCount} notifications.",
                    representative.Name, representative.Id.AsGuid(), representative.Notifs.Count);

                foreach (var notif in representative.Notifs)
                {
                    if (!listVvnCodes.Any(v => v.Code == notif.Code))
                    {
                        listVvnCodes.Add(notif);
                        _logger.LogDebug("Added notification {Code}.", notif.Code);
                    }
                }
            }
        }
        else
        {
            var selected = listRepresentatives.FirstOrDefault(r => r.Id.AsGuid() == representativeId);
            if (selected != null)
            {
                _logger.LogInformation("Selected specific SAR {Name} ({Id}) with {NotifCount} notifications.",
                    selected.Name, selected.Id.AsGuid(), selected.Notifs.Count);
                listVvnCodes.AddRange(selected.Notifs);
            }
            else
            {
                _logger.LogWarning("No representative found with ID {RepId}", representativeId);
            }
        }

        var listNotifications = new List<VesselVisitNotification>();

        foreach (var code in listVvnCodes)
        {
            var notif = await _repo.GetByCodeAsync(code);
            if (notif == null)
            {
                _logger.LogWarning("VVN {Code} is associated to a SAR but not found in DB.", code.Code);
                throw new BusinessRuleValidationException($"No VVN found on DB but it's associated to a SAR = {code}");
            }

            listNotifications.Add(notif);
            _logger.LogDebug("Added full VVN entity for {Code}.", code.Code);
        }

        _logger.LogInformation("Total VVNs collected: {Count}", listNotifications.Count);
        return listNotifications;
    }


    private async Task<List<ShippingAgentRepresentative>> GetShippingAgentRepresentativesBySaoAsync(Guid idSarWhoImAm)
    {
        _logger.LogInformation("Fetching organization and colleagues for SAR {SAR_ID}", idSarWhoImAm);

        var representativeInDb = await _shippingAgentRepresentativeRepository
            .GetByIdAsync(new ShippingAgentRepresentativeId(idSarWhoImAm));

        if (representativeInDb == null)
        {
            _logger.LogWarning("No representative found in DB with ID {SAR_ID}", idSarWhoImAm);
            throw new BusinessRuleValidationException($"No representative found with ID {idSarWhoImAm}");
        }

        var organizationCode = representativeInDb.SAO;
        if (organizationCode == null)
        {
            _logger.LogError("Representative {SAR_ID} has no organization assigned!", idSarWhoImAm);
            throw new BusinessRuleValidationException($"SAR {idSarWhoImAm} is not associated with any organization.");
        }

        var organizationInDb = await _shippingAgentOrganizationRepository.GetByCodeAsync(organizationCode);
        if (organizationInDb == null)
        {
            _logger.LogError("Organization with code {Code} not found for SAR {SAR_ID}", organizationCode.Value,
                idSarWhoImAm);
            throw new BusinessRuleValidationException($"No organization found for code {organizationCode.Value}");
        }

        var reps = await _shippingAgentRepresentativeRepository.GetAllSarBySaoAsync(organizationCode);
        _logger.LogInformation("Found {Count} SARs under organization {OrgCode}", reps.Count, organizationCode.Value);

        return reps;
    }


    private async Task<VesselVisitNotificationId> GetIdByCodeAsync(VvnCode code)
    {
        if (code == null)
            throw new BusinessRuleValidationException("VVN code provided cannot be null!");

        var vvn = await _repo.GetByCodeAsync(code);
        if (vvn == null)
            throw new BusinessRuleValidationException("No VVN found in the system with the provided code!");

        return vvn.Id;
    }

    private async Task<ImoNumber> CheckForVesselInDb(string dtoVesselImo)
    {
        if (string.IsNullOrWhiteSpace(dtoVesselImo))
            throw new BusinessRuleValidationException("Vessel IMO cannot be null or empty.");

        var newImo = new ImoNumber(dtoVesselImo);
        var vessel = await _vesselRepository.GetByImoNumberAsync(newImo)
                     ?? throw new BusinessRuleValidationException(
                         $"System couldn't find a Vessel with the given IMO number [{dtoVesselImo}].");

        return vessel.ImoNumber;
    }


    private async Task<List<EntityTask>> CreateTasksAsync(CargoManifest cargoManifest, DockCode dockCode)
    {
        var tasks = new List<EntityTask>();
        var manifestType = cargoManifest.Type;
        var taskCount = await _taskRepository.CountAsync();

        foreach (var entry in cargoManifest.ContainerEntries)
        {
            var storage = await _storageAreaRepository.GetByIdAsync(entry.StorageAreaId)
                          ?? throw new BusinessRuleValidationException(
                              $"Storage area {entry.StorageAreaId} not found.");

            taskCount++;
            string location = manifestType == CargoManifestType.Unloading ? storage.Name : dockCode.Value;

            tasks.Add(new EntityTask(await GenerateNextTaskCodeAsync(TaskType.ContainerHandling, taskCount),
                $"{location} - Container Handling", TaskType.ContainerHandling));

            tasks.Add(new EntityTask(await GenerateNextTaskCodeAsync(TaskType.YardTransport, taskCount),
                $"{location} - Yard Transport", TaskType.YardTransport));

            if (manifestType == CargoManifestType.Unloading)
            {
                tasks.Add(new EntityTask(await GenerateNextTaskCodeAsync(TaskType.StoragePlacement, taskCount),
                    $"{storage.Name} - Storage Placement", TaskType.StoragePlacement));
            }
        }

        return tasks;
    }

    private async Task<CrewManifest> CreateCrewManifestAsync(CreatingCrewManifestDto dto)
    {
        var crewMembers = dto.CrewMembers?
            .Select(cm => new CrewMember(cm.Name, cm.Role, cm.Nationality, new CitizenId(cm.CitizenId)))
            .ToList() ?? new List<CrewMember>();

        var crewManifest = new CrewManifest(dto.TotalCrew, dto.CaptainName, crewMembers);
        await _crewManifestRepository.AddAsync(crewManifest);
        //await _unitOfWork.CommitAsync();

        return crewManifest;
    }

    private async Task<CargoManifest?> CreateCargoManifestAsync(CreatingCargoManifestDto? dto)
    {
        if (dto == null)
            return null;

        if (dto.Entries == null || !dto.Entries.Any())
            throw new BusinessRuleValidationException("CargoManifest must contain at least one entry.");

        var entries = new List<CargoManifestEntry>();

        foreach (var entryDto in dto.Entries)
        {
            var container = await GetOrCreateContainerAsync(entryDto.Container);

            var storageAreaId = await GetStorageAreaId(entryDto.StorageAreaName);

            var entry = new CargoManifestEntry(container, storageAreaId, entryDto.Bay, entryDto.Row, entryDto.Tier);

            await _cargoManifestEntryRepository.AddAsync(entry);
            entries.Add(entry);
        }

        var generatedCode = await GenerateNextCargoManifestCodeAsync();
        var cargoManifest =
            new CargoManifest(entries, generatedCode, dto.Type, DateTime.UtcNow, new Email(dto.CreatedBy));

        await _cargoManifestRepository.AddAsync(cargoManifest);
        //await _unitOfWork.CommitAsync();

        return cargoManifest;
    }


    private async Task<StorageAreaId> GetStorageAreaId(string entryDtoStorageAreaName)
    {
        if (entryDtoStorageAreaName.IsNullOrEmpty())
            throw new BusinessRuleValidationException("Storage area Id cannot be empty.");

        var storageArea = await _storageAreaRepository.GetByNameAsync(entryDtoStorageAreaName);

        if (storageArea == null)
            throw new BusinessRuleValidationException(
                $"Storage Area with Name [{entryDtoStorageAreaName}] not found in the database.");

        return storageArea.Id;
    }


    private async Task<EntityContainer> GetOrCreateContainerAsync(CreatingContainerDto containerDto)
    {
        var container = await _containerRepository.GetByIsoNumberAsync(new Iso6346Code(containerDto.IsoCode));
        if (container != null)
            return container;

        container = new EntityContainer(
            containerDto.IsoCode,
            containerDto.Description,
            containerDto.Type,
            containerDto.WeightKg
        );

        await _containerRepository.AddAsync(container);
        //await _unitOfWork.CommitAsync();
        return container;
    }

    private async Task<string> GenerateNextCargoManifestCodeAsync()
    {
        var count = await _cargoManifestRepository.CountAsync();
        return $"CGM-{(count + 1).ToString("D4")}";
    }

    private async Task<TaskCode> GenerateNextTaskCodeAsync(TaskType taskType, int count)
    {
        int nextNumber = count + 1;
        return new TaskCode(taskType, nextNumber);
    }

    private async Task<VvnCode> GenerateNextVvnCodeAsync()
    {
        var list = await _repo.GetAllAsync();
        var nextSequence = list.Count + 1;

        var formattedSequence = nextSequence.ToString("D6");

        return new VvnCode(DateTime.Now.Year.ToString(), formattedSequence);
    }

    private async Task<DockCode> BasicDockAttributionAlgorithm(ImoNumber imo)
    {
        var vessel = await _vesselRepository.GetByImoNumberAsync(imo);
        if (vessel == null)
            throw new BusinessRuleValidationException("Vessel with provided imo not found");

        var possibleDocks = await _dockRepository.GetAllDocksForVesselType(vessel.VesselTypeId);
        var availableDocks = possibleDocks.Where(d => d.Status.Equals(DockStatus.Available)).ToList();
        if (availableDocks.IsNullOrEmpty())
            throw new BusinessRuleValidationException(
                "Unable to find available docks suitable for the requested vessel type. Please review the docking requirements or try again later");
        int dockCount = availableDocks.Count;

        var random = new Random();
        var attributedDock = random.Next(dockCount);
        if (!_dockRepository.SetUnavailable(availableDocks[attributedDock].Code))
            throw new BusinessRuleValidationException("Unable to set dock status");

        return availableDocks[attributedDock].Code;
    }

    private void checkNeededPersonel(CargoManifest cargoManifest, CrewManifest crewManifest)
    {
        bool hasHazmat = false;
        foreach (var entry in cargoManifest.ContainerEntries)
        {
            if (entry.Container.Type.Equals(ContainerType.Hazmat))
            {
                hasHazmat = true;
                break;
            }
        }

        if (hasHazmat && crewManifest.CrewMembers.IsNullOrEmpty())
        {
            throw new BusinessRuleValidationException(
                "Hazmat cargo! Make sure a the Crew Manifest has a Safety Officer associated!");
        }

        if (hasHazmat && !crewManifest.CrewMembers.IsNullOrEmpty())
        {
            bool securityFound = false;
            foreach (var crewMember in crewManifest.CrewMembers)
            {
                if (crewMember.Role.Equals(CrewRole.SafetyOfficer))
                {
                    securityFound = true;
                    break;
                }
            }

            if (!securityFound)
            {
                throw new BusinessRuleValidationException(
                    "Hazmat cargo! Make sure a the Crew Manifest has a Safety Officer associated!");
            }
        }
    }
}