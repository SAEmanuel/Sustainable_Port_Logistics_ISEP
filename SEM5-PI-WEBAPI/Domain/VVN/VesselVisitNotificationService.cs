using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public class VesselVisitNotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICargoManifestEntryRepository _cargoManifestEntryRepository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly ICargoManifestRepository _cargoManifestRepository;
    private readonly ICrewManifestRepository _crewManifestRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IStaffMemberRepository _staffMemberRepository;
    private readonly ICrewMemberRepository _crewMemberRepository;
    private readonly IContainerRepository _containerRepository;
    private readonly IVesselVisitNotificationRepository _repo;
    private readonly ITaskRepository _taskRepository;

    public VesselVisitNotificationService(IUnitOfWork unitOfWork,
        ICargoManifestEntryRepository cargoManifestEntryRepository,
        IPhysicalResourceRepository physicalResourceRepository, ICargoManifestRepository cargoManifestRepository,
        ICrewManifestRepository crewManifestRepository, IStorageAreaRepository storageAreaRepository,
        IStaffMemberRepository staffMemberRepository, ICrewMemberRepository crewMemberRepository,
        IContainerRepository containerRepository, IVesselVisitNotificationRepository repo,
        ITaskRepository taskRepository)
    {
        _unitOfWork = unitOfWork;
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
    }

    public async Task<VesselVisitNotificationDto> AddAsync(CreatingVesselVisitNotificationDto dto)
    {
        var loadingCargoManifest = await CreateCargoManifestAsync(dto.LoadingCargoManifest);
        var unloadingCargoManifest = await CreateCargoManifestAsync(dto.UnloadingCargoManifest);
        

        return null; 
    }

    
    
    
    
    
    
    
    
    
    // ------------- Private Methods -------------
    
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
}