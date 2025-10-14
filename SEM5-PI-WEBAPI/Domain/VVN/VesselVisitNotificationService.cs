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
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;



namespace SEM5_PI_WEBAPI.Domain.VVN;

public class VesselVisitNotificationService : IVesselVisitNotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<VesselVisitNotificationService> _logger;
    private readonly ICargoManifestRepository _cargoManifestRepository;
    private readonly ICargoManifestEntryRepository _cargoManifestEntryRepository;
    private readonly ICrewManifestRepository _crewManifestRepository;
    private readonly ICrewMemberRepository _crewMemberRepository;
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
        
        // FALTA VERIFICAR SE A CARGA DO (UN)LOADING É PERIGOSA E VER SE HÁ STAFF PARA ISSO
        
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
        
        if (vvnInDb.UnloadingCargoManifest != null)
        {
            var unloadingTasks = await CreateTasksAsync(vvnInDb.UnloadingCargoManifest, dock.Value);
            tasks.AddRange(unloadingTasks);
        }
        
        if (vvnInDb.LoadingCargoManifest != null)
        {
            var loadingTasks = await CreateTasksAsync(vvnInDb.LoadingCargoManifest, dock.Value);
            tasks.AddRange(loadingTasks);
        }
        
        vvnInDb.SetTasks(tasks);
        
        await _unitOfWork.CommitAsync();
        
        _logger.LogInformation("VVN with Code = {code} Accepted successfully.", code.ToString());
        
        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }

    public async Task<VesselVisitNotificationDto> MarkAsPendingAsync(VvnCode code, string reason)
    {
        _logger.LogInformation("Business Domain: Marking VVN as Pending Information for code = {code}", code);

        VesselVisitNotificationId id = await GetIdByCodeAsync(code);
        var vvnInDb = await _repo.GetByIdAsync(id)
                      ?? throw new BusinessRuleValidationException(
                          $"No Vessel Visit Notification found with Code = {code}");

        if (vvnInDb.Status.StatusValue != VvnStatus.Submitted)
        {
            throw new BusinessRuleValidationException(
                "Provided VVN has not been submitted yet and cannot be marked as pending information.");
        }

        vvnInDb.MarkPending(reason);

        await _unitOfWork.CommitAsync();

        _logger.LogInformation(
            "VVN with Code = {code} marked as Pending Information with message \"{message}\" successfully.", code,
            reason);

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


    //========================================

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

    
    private async Task<List<EntityTask>> CreateTasksAsync(CargoManifest cargoManifest, string dock)
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
            string location = manifestType == CargoManifestType.Unloading ? storage.Name : dock;

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

    private async Task<CrewManifest?> CreateCrewManifestAsync(CreatingCrewManifestDto? dto)
    {
        if (dto == null)
            return null;

        var crewMembers = dto.CrewMembers?
            .Select(cm => new CrewMember(cm.Name, cm.Role, cm.Nationality, new CitizenId(cm.CitizenId)))
            .ToList() ?? new List<CrewMember>();

        var crewManifest = new CrewManifest(dto.TotalCrew, dto.CaptainName, crewMembers);
        await _crewManifestRepository.AddAsync(crewManifest);
        await _unitOfWork.CommitAsync();

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

            var storageAreaId = await GetStorageAreaId(entryDto.StorageAreaId);

            var entry = new CargoManifestEntry(container, storageAreaId, entryDto.Bay, entryDto.Row, entryDto.Tier);

            await _cargoManifestEntryRepository.AddAsync(entry);
            entries.Add(entry);
        }

        var generatedCode = await GenerateNextCargoManifestCodeAsync();
        var cargoManifest = new CargoManifest(entries, generatedCode, dto.Type, DateTime.UtcNow, dto.CreatedBy);

        await _cargoManifestRepository.AddAsync(cargoManifest);
        await _unitOfWork.CommitAsync();

        return cargoManifest;
    }


    private async Task<StorageAreaId> GetStorageAreaId(Guid entryDtoStorageAreaId)
    {
        if (entryDtoStorageAreaId == Guid.Empty)
            throw new BusinessRuleValidationException("Storage area Id cannot be empty.");

        var storageArea = await _storageAreaRepository.GetByIdAsync(new StorageAreaId(entryDtoStorageAreaId));

        if (storageArea == null)
            throw new BusinessRuleValidationException(
                $"Storage Area with Id [{entryDtoStorageAreaId}] not found in the database.");

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
        await _unitOfWork.CommitAsync();
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

    private async Task<DockId> BasicDockAttributionAlgorithm(ImoNumber imo)
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
        
        return availableDocks[attributedDock].Id;
    }
}