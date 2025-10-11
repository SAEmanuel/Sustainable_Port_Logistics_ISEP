using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using Task = SEM5_PI_WEBAPI.Domain.Tasks.Task;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public class VesselVisitNotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<VesselVisitNotificationService> _logger;
    private readonly ICargoManifestEntryRepository _cargoManifestEntryRepository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly ICargoManifestRepository _cargoManifestRepository;
    private readonly ICrewManifestRepository _crewManifestRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IStaffMemberRepository _staffMemberRepository;
    private readonly ICrewMemberRepository _crewMemberRepository;
    private readonly IDockRepository _dockRepository;
    private readonly IVesselRepository  _vesselRepository;
    private readonly IContainerRepository _containerRepository;
    private readonly IVesselVisitNotificationRepository _repo;
    private readonly ITaskRepository _taskRepository;

    public VesselVisitNotificationService(IUnitOfWork unitOfWork,
        ICargoManifestEntryRepository cargoManifestEntryRepository,
        IPhysicalResourceRepository physicalResourceRepository, ICargoManifestRepository cargoManifestRepository,
        ICrewManifestRepository crewManifestRepository, IStorageAreaRepository storageAreaRepository,
        IStaffMemberRepository staffMemberRepository, ICrewMemberRepository crewMemberRepository,
        IContainerRepository containerRepository, IVesselVisitNotificationRepository repo,
        ITaskRepository taskRepository, IVesselRepository vesselRepository,IDockRepository dockRepository,ILogger<VesselVisitNotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _cargoManifestEntryRepository = cargoManifestEntryRepository;
        _physicalResourceRepository = physicalResourceRepository;
        _cargoManifestRepository = cargoManifestRepository;
        _crewManifestRepository = crewManifestRepository;
        _storageAreaRepository = storageAreaRepository;
        _staffMemberRepository = staffMemberRepository;
        _crewMemberRepository = crewMemberRepository;
        _containerRepository = containerRepository;
        _repo = repo;
        _taskRepository = taskRepository;
        _vesselRepository = vesselRepository;
        _dockRepository = dockRepository;
    }

        
            
    
    public async Task<VesselVisitNotificationDto> AddAsync(CreatingVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("Business Domain: Request to add new VVN.");

        var loadingCargoManifest = await CreateCargoManifestAsync(dto.LoadingCargoManifest);
        var unloadingCargoManifest = await CreateCargoManifestAsync(dto.UnloadingCargoManifest);
        var crewManifest = await CreateCrewManifestAsync(dto.CrewManifest);
        var vvnCode = await GenerateNextVvnCodeAsync();
        var vesselImo = await CheckForVesselInDb(dto.VesselImo);
        var listDocks = await CreateListWithDocksIds(dto.ListDocks);

        if (unloadingCargoManifest != null) {var unloadingTasks = await CreateTasksAsync(unloadingCargoManifest, "", "");}
        if (loadingCargoManifest != null) {var loadingTasks = await CreateTasksAsync(loadingCargoManifest, "", "");}
            
        var newVesselVisitNotification = VesselVisitNotificationFactory.CreateVesselVisitNotification(vvnCode, dto.EstimatedTimeArrival,dto.EstimatedTimeDeparture,dto.Volume,null,listDocks,crewManifest,loadingCargoManifest,unloadingCargoManifest,vesselImo);
        
        await _repo.AddAsync(newVesselVisitNotification);
        await _unitOfWork.CommitAsync();
        
        _logger.LogInformation("Business Domain: VVN created successfully with ID = {Id}", newVesselVisitNotification.Id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(newVesselVisitNotification);
    }
    

    

    public async Task<VesselVisitNotificationDto> GetByIdAsync(VesselVisitNotificationId id)
    {
        _logger.LogInformation("Business Domain: Request to fetch VVN with ID = {Id}", id.Value);
        
        var vvnInDb = await _repo.GetByIdAsync(id);

        if (vvnInDb == null) throw new BusinessRuleValidationException("No VVN Found with ID : {id.Value}");
        
        _logger.LogInformation("Business Domain: VVN with ID = {Id} found successfully.", id.Value);

        return VesselVisitNotificationFactory.CreateVesselVisitNotificationDto(vvnInDb);
    }


    // ------------- Private Methods -------------

    private async Task<ImoNumber?> CheckForVesselInDb(string dtoVesselImo)
    {
        var newImo = new ImoNumber(dtoVesselImo);
        var vessel = await _vesselRepository.GetByImoNumberAsync(newImo);
        
        if (vessel == null)
            throw new BusinessRuleValidationException($"Error Creating VVN : System couldn't found a Vessel with the given ImoNumber [{dtoVesselImo}].");
        
        return vessel.ImoNumber;
    }
    
    private async Task<List<EntityDock>> CreateListWithDocksIds(List<string> dtoListDocks)
    {
        if (dtoListDocks == null || !dtoListDocks.Any())
            return new List<EntityDock>();

        var listDockCodes = dtoListDocks.Select(code => new DockCode(code)).ToList();

        var allDocksInSys = await _dockRepository.GetAllAsync();

        var listEntityDock = new List<EntityDock>();

        foreach (var dockCode in listDockCodes)
        {
            var existingDock = allDocksInSys.FirstOrDefault(d => d.Code.Equals(dockCode));
            if (existingDock == null)
                throw new BusinessRuleValidationException($"Error creating VVN: Dock with code [{dockCode}] not found in the system.");

            listEntityDock.Add(existingDock);
        }

        return listEntityDock;
    }
    
    private async Task<List<Task>> CreateTasksAsync(CargoManifest cargoManifest, string dock, string storage)
    {
        var tasks = new List<Task>();
        var manifestType = cargoManifest.Type;
        var taskCount = _taskRepository.CountAsync().Result - 1;

        foreach (var entry in cargoManifest.ContainerEntries)
        {
            taskCount++;
            var containerHandlingDesc = manifestType == CargoManifestType.Unloading ? $"{storage} - Container Handling" : $"{dock} - Container Handling";
            var yardTransportDesc = manifestType == CargoManifestType.Unloading ? $"{storage} - Yard Transport" : $"{dock} - Yard Transport";

            var containerHandlingTask = new Task(
                await GenerateNextTaskCodeAsync(TaskType.ContainerHandling, taskCount),
                containerHandlingDesc,
                TaskType.ContainerHandling);
            tasks.Add(containerHandlingTask);

            var yardTransportTask = new Task(
                await GenerateNextTaskCodeAsync(TaskType.YardTransport, taskCount),
                yardTransportDesc,
                TaskType.YardTransport);
            tasks.Add(yardTransportTask);

            if (manifestType == CargoManifestType.Unloading)
            {
                var storagePlacementDesc = $"{storage} - Storage Placement";
                var storagePlacementTask = new Task(
                    await GenerateNextTaskCodeAsync(TaskType.StoragePlacement, taskCount),
                    storagePlacementDesc,
                    TaskType.StoragePlacement);
                tasks.Add(storagePlacementTask);
            }
        }

        return tasks;
    }



    private async Task<CrewManifest> CreateCrewManifestAsync(CreatingCrewManifestDto? dto)
    {
        if (dto == null)
            return null;

        var hasCrewMembers = dto.CrewMembers != null;
        var crewMembers = new List<CrewMember>();
        if (hasCrewMembers)
        {
            foreach (var crewMemberDto in dto.CrewMembers)
            {
                var member = new CrewMember(crewMemberDto.Name, crewMemberDto.Role, crewMemberDto.Nationality,
                    new CitizenId(crewMemberDto.CitizenId));

                crewMembers.Add(member);
            }
        }

        var crewManifest = new CrewManifest(dto.TotalCrew, dto.CaptainName, crewMembers);
        await _crewManifestRepository.AddAsync(crewManifest);
        return crewManifest;
    }

    private async Task<CargoManifest?> CreateCargoManifestAsync(CreatingCargoManifestDto? dto)
    {
        if (dto == null)
            return null;

        var entries = new List<CargoManifestEntry>();
        foreach (var entryDto in dto.Entries)
        {
            var container = await GetOrCreateContainerAsync(entryDto.Container);
            var entry = new CargoManifestEntry(container, new StorageAreaId(entryDto.StorageAreaId), entryDto.Bay,
                entryDto.Row, entryDto.Tier);
            entries.Add(entry);
        }

        var generatedCode = await GenerateNextCargoManifestCodeAsync();
        var cargoManifest = new CargoManifest(entries, generatedCode, dto.Type, DateTime.UtcNow, dto.CreatedBy);

        await _cargoManifestRepository.AddAsync(cargoManifest);

        return cargoManifest;
    }

    private async Task<EntityContainer> GetOrCreateContainerAsync(CreatingContainerDto containerDto)
    {
        var container = await _containerRepository.GetByIsoNumberAsync(new Iso6346Code(containerDto.IsoCode));
        if (container != null)
            return container;

        container = new EntityContainer(containerDto.IsoCode,
            containerDto.Description,
            containerDto.Type,
            containerDto.WeightKg);
        await _containerRepository.AddAsync(container);
        return container;
    }


    private async Task<string> GenerateNextCargoManifestCodeAsync()
    {
        var count = await _cargoManifestRepository.CountAsync();
        int nextNumber = count + 1;
        return $"CGM-{nextNumber.ToString("D4")}";
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

        return new VvnCode(DateTime.Now.Year.ToString(),nextSequence.ToString());
    }
}